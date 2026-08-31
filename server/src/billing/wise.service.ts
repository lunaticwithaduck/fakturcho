import { verify as cryptoVerify } from 'node:crypto';
import type { CreditPackId, WiseTransferInstructionsDto } from '@fakturcho/shared-types';
import { CREDIT_PACKS } from '@fakturcho/shared-types';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, WisePendingPurchaseStatus } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { inspectWiseConfig, resolveWebhookPublicKey, type WiseConfigReport } from './wise-config';
import {
  extractReferenceCandidates,
  fetchStatement,
  generateReference,
  type WiseStatementTransaction,
} from './wise-statement';

const REFERENCE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // instructions shown to the payer are valid 7 days
const STATEMENT_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000; // reconcile window scanned on every balances#update poke

export interface WiseBalanceUpdateEvent {
  event_type: string;
  data: {
    resource: { id: number; profile_id: number; type: string };
    occurred_at: string;
  };
  subscription_id?: string;
}

@Injectable()
export class WiseService {
  private readonly logger = new Logger(WiseService.name);
  private readonly apiToken: string;
  private readonly profileId: string;
  private readonly balanceId: string;
  private readonly iban: string;
  private readonly bic: string | null;
  private readonly accountHolderName: string;
  private readonly config: WiseConfigReport;
  private readonly webhookPublicKey: string;
  private readonly apiBase: string;

  constructor(private readonly prisma: PrismaService) {
    this.apiToken = process.env.WISE_API_TOKEN ?? '';
    this.profileId = process.env.WISE_PROFILE_ID ?? '';
    this.balanceId = process.env.WISE_BALANCE_ID ?? '';
    this.iban = process.env.WISE_IBAN ?? '';
    this.bic = process.env.WISE_BIC || null;
    this.accountHolderName = process.env.WISE_ACCOUNT_HOLDER_NAME ?? '';
    this.config = inspectWiseConfig({
      environment: process.env.WISE_ENVIRONMENT,
      apiToken: this.apiToken,
      profileId: this.profileId,
      balanceId: this.balanceId,
      iban: this.iban,
      accountHolderName: this.accountHolderName,
      webhookPublicKey: process.env.WISE_WEBHOOK_PUBLIC_KEY ?? '',
    });
    for (const problem of this.config.blocking) this.logger.error(problem);
    for (const problem of this.config.warnings) this.logger.warn(problem);
    this.logger.log(`Wise client running against ${this.config.environment}`);

    this.webhookPublicKey = resolveWebhookPublicKey({
      environment: this.config.environment,
      configured: process.env.WISE_WEBHOOK_PUBLIC_KEY ?? '',
    });
    this.apiBase =
      this.config.environment === 'live'
        ? 'https://api.wise.com'
        : 'https://api.sandbox.transferwise.tech';
  }

  async createTransferInstructions(
    accountId: string,
    product: CreditPackId,
  ): Promise<WiseTransferInstructionsDto> {
    const [blocker] = this.config.blocking;
    if (blocker !== undefined) {
      throw new DomainError('CHECKOUT_NOT_CONFIGURED', blocker, {
        provider: ['wise_credentials_missing', `environment ${this.config.environment}`],
      });
    }
    const amountCents = CREDIT_PACKS[product].eurCents;
    const reference = generateReference();
    const expiresAt = new Date(Date.now() + REFERENCE_EXPIRY_MS);

    await this.prisma.wisePendingPurchase.create({
      data: { accountId, reference, creditCents: amountCents, amountCents, currency: 'EUR' },
    });

    return {
      reference,
      amountCents,
      currency: 'EUR',
      iban: this.iban,
      accountHolderName: this.accountHolderName,
      bic: this.bic,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /** RSA-SHA256 verify against Wise's webhook-signing public key (docs.wise.com — Events guide,
   * X-Signature-SHA256 header, base64 signature over the raw request body). */
  verifyWebhookSignature(rawBody: string, signatureBase64: string): boolean {
    try {
      return cryptoVerify(
        'RSA-SHA256',
        Buffer.from(rawBody),
        { key: this.webhookPublicKey, padding: 1 /* crypto.constants.RSA_PKCS1_PADDING */ },
        Buffer.from(signatureBase64, 'base64'),
      );
    } catch (error) {
      this.logger.warn(`Wise webhook signature check threw: ${(error as Error).message}`);
      return false;
    }
  }

  /** balances#update carries no amount/reference — just a poke that something changed on this
   * balance. Fetch the recent statement and try to match each CREDIT entry to a PENDING purchase
   * by reference, then fulfil idempotently keyed on wiseTransactionId. */
  async handleBalanceUpdateWebhook(event: WiseBalanceUpdateEvent): Promise<void> {
    if (event.event_type !== 'balances#update') return;
    if (String(event.data.resource.id) !== this.balanceId) return;

    const statement = await fetchStatement({
      apiBase: this.apiBase,
      apiToken: this.apiToken,
      profileId: this.profileId,
      balanceId: this.balanceId,
      lookbackMs: STATEMENT_LOOKBACK_MS,
    });
    for (const tx of statement.transactions) {
      if (tx.type !== 'CREDIT') continue;
      await this.tryFulfil(tx);
    }
  }

  private async tryFulfil(tx: WiseStatementTransaction): Promise<void> {
    const candidates = extractReferenceCandidates(tx);
    const pending = await this.matchPendingPurchase(candidates);
    if (!pending) return;
    // amount must at least cover what was asked for — a short bank transfer never fulfils
    if (tx.amount.currency !== pending.currency || tx.amount.value * 100 < pending.amountCents) {
      this.logger.warn(
        `Wise credit matched reference ${pending.reference} but amount/currency mismatch ` +
          `(got ${tx.amount.value} ${tx.amount.currency}, wanted ${pending.amountCents} ${pending.currency} cents)`,
      );
      return;
    }
    const wiseTransactionId = tx.referenceNumber ?? `${pending.reference}-${tx.date}`;
    try {
      await this.prisma.$transaction([
        this.prisma.creditLedgerEntry.create({
          data: {
            accountId: pending.accountId,
            amountCents: pending.creditCents,
            reason: 'PURCHASE',
            wiseTransactionId,
          },
        }),
        this.prisma.account.update({
          where: { id: pending.accountId },
          data: { creditBalanceCents: { increment: pending.creditCents } },
        }),
        this.prisma.wisePendingPurchase.update({
          where: { id: pending.id },
          data: { status: WisePendingPurchaseStatus.FULFILLED, fulfilledAt: new Date() },
        }),
      ]);
    } catch (error) {
      // a duplicate delivery hits the wiseTransactionId unique index, not an error —
      // same idempotency shape as SPEC §11 invariant 22
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
      throw error;
    }
  }

  private async matchPendingPurchase(candidates: string[]) {
    if (candidates.length === 0) return null;
    const pending = await this.prisma.wisePendingPurchase.findMany({
      where: { status: WisePendingPurchaseStatus.PENDING },
    });
    for (const purchase of pending) {
      const hit = candidates.some((c) => c.toUpperCase().includes(purchase.reference));
      if (hit) return purchase;
    }
    return null;
  }
}
