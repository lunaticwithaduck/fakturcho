import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import { PaddleService } from './paddle.service';
import { grantSignupCredits } from './signup-grant';

const WEBHOOK_SECRET = 'test-webhook-secret';

function sign(rawBody: string, secret: string, ts = Math.floor(Date.now() / 1000)): string {
  const hmac = createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex');
  return `ts=${ts};h1=${hmac}`;
}

function transactionCompletedPayload(
  accountId: string,
  transactionId: string,
  creditCents?: number,
): string {
  const now = new Date().toISOString();
  return JSON.stringify({
    event_id: `evt_${transactionId}`,
    event_type: 'transaction.completed',
    occurred_at: now,
    notification_id: `ntf_${transactionId}`,
    data: {
      id: transactionId,
      status: 'completed',
      customer_id: 'ctm_123',
      address_id: null,
      business_id: null,
      custom_data: creditCents === undefined ? { accountId } : { accountId, creditCents },
      currency_code: 'EUR',
      origin: 'web',
      subscription_id: null,
      invoice_id: null,
      invoice_number: null,
      collection_mode: 'automatic',
      discount_id: null,
      billing_details: null,
      billing_period: null,
      items: [],
      details: null,
      payments: [],
      checkout: null,
      created_at: now,
      updated_at: now,
      billed_at: null,
      revised_at: null,
    },
  });
}

describe('credit pack fulfilment webhook', () => {
  let db: TestDatabase;
  let billing: BillingService;
  let credits: CreditsService;
  let paddle: PaddleService;

  beforeAll(async () => {
    process.env.PADDLE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.PADDLE_API_KEY = 'test-api-key';
    db = await startTestDatabase();
    paddle = new PaddleService();
    const prismaService = db.prisma as unknown as PrismaService;
    billing = new BillingService(prismaService, paddle);
    credits = new CreditsService(prismaService);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  async function deliver(rawBody: string): Promise<void> {
    const event = await paddle.parseWebhook(rawBody, sign(rawBody, WEBHOOK_SECRET));
    await billing.handleWebhookEvent(event);
  }

  it('invariant 22: the same transaction.completed delivered twice credits the pack exactly once', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const rawBody = transactionCompletedPayload(account.id, 'txn_dup', 500);

    await deliver(rawBody);
    await deliver(rawBody);

    const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(updated.creditBalanceCents).toBe(500);

    const entries = await db.prisma.creditLedgerEntry.findMany({
      where: { accountId: account.id },
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      amountCents: 500,
      reason: 'PURCHASE',
      paddleTransactionId: 'txn_dup',
    });
  });

  it('invariant 22: after a mixed sequence of grants, purchases and spends the balance equals the ledger sum', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const accountId = account.id;

    await db.prisma.$transaction((tx) => grantSignupCredits(tx, accountId));
    await deliver(transactionCompletedPayload(accountId, 'txn_mixed', 500));

    for (let i = 0; i < 2; i += 1) {
      const document = await db.prisma.document.create({
        data: { accountId, documentType: 'INVOICE' },
      });
      await db.prisma.$transaction((tx) => credits.chargeForIssuance(tx, accountId, document.id));
    }

    await deliver(transactionCompletedPayload(accountId, 'txn_mixed', 500));

    const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    expect(updated.creditBalanceCents).toBe(580);

    const entries = await db.prisma.creditLedgerEntry.findMany({ where: { accountId } });
    const ledgerSum = entries.reduce((sum, entry) => sum + entry.amountCents, 0);
    expect(ledgerSum).toBe(updated.creditBalanceCents);
    expect(entries.map((entry) => entry.reason).sort()).toEqual([
      'ISSUANCE',
      'ISSUANCE',
      'PURCHASE',
      'SIGNUP_GRANT',
    ]);

    const balance = await credits.getBalance(accountId);
    expect(balance).toEqual({
      balanceCents: 580,
      documentsRemaining: 58,
      hasUnlimitedSubscription: false,
    });
  });

  it('ignores transaction.completed events without creditCents in customData', async () => {
    const account = await db.prisma.account.create({ data: {} });

    await deliver(transactionCompletedPayload(account.id, 'txn_subscription_billing'));

    const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(updated.creditBalanceCents).toBe(0);
    const entries = await db.prisma.creditLedgerEntry.count({
      where: { accountId: account.id },
    });
    expect(entries).toBe(0);
  });
});
