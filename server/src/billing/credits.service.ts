import type {
  CreditBalanceDto,
  CreditLedgerEntryDto,
  CreditLedgerReason as CreditLedgerReasonDto,
} from '@fakturcho/shared-types';
import { ISSUANCE_COST_CENTS } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { CreditLedgerEntry, Prisma } from '@prisma/client';
import { CreditLedgerReason } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { grantSignupCredits } from './signup-grant';

const REASON_TO_DTO: Record<CreditLedgerReason, CreditLedgerReasonDto> = {
  SIGNUP_GRANT: 'signup_grant',
  PURCHASE: 'purchase',
  ISSUANCE: 'issuance',
  ADJUSTMENT: 'adjustment',
};

function toLedgerDto(entry: CreditLedgerEntry): CreditLedgerEntryDto {
  return {
    id: entry.id,
    amountCents: entry.amountCents,
    reason: REASON_TO_DTO[entry.reason],
    documentId: entry.documentId,
    createdAt: entry.createdAt.toISOString(),
  };
}

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(accountId: string): Promise<CreditBalanceDto> {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new DomainError('NOT_FOUND', 'Account not found.');
    return {
      balanceCents: account.creditBalanceCents,
      documentsRemaining: Math.floor(account.creditBalanceCents / ISSUANCE_COST_CENTS),
    };
  }

  async getLedger(accountId: string): Promise<CreditLedgerEntryDto[]> {
    const entries = await this.prisma.creditLedgerEntry.findMany({
      where: { accountId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
    });
    return entries.map(toLedgerDto);
  }

  async grantSignupCredits(tx: Prisma.TransactionClient, accountId: string): Promise<void> {
    await grantSignupCredits(tx, accountId);
  }

  async chargeForIssuance(
    tx: Prisma.TransactionClient,
    accountId: string,
    documentId: string,
  ): Promise<void> {
    // SPEC §11 invariant 21: atomic guarded deduction, never read-then-write
    const affected = await tx.$executeRaw`
      UPDATE "account"
      SET "creditBalanceCents" = "creditBalanceCents" - ${ISSUANCE_COST_CENTS}
      WHERE "id" = ${accountId} AND "creditBalanceCents" >= ${ISSUANCE_COST_CENTS}
    `;
    if (affected === 0) {
      throw new DomainError(
        'INSUFFICIENT_CREDITS',
        'The credit balance does not cover issuing this document.',
      );
    }
    await tx.creditLedgerEntry.create({
      data: {
        accountId,
        amountCents: -ISSUANCE_COST_CENTS,
        reason: CreditLedgerReason.ISSUANCE,
        documentId,
      },
    });
  }
}
