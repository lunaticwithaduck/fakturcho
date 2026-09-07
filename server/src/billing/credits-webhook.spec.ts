import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import type { RevolutOrder, RevolutService } from './revolut.service';
import { grantSignupCredits } from './signup-grant';

function completedOrder(overrides: Partial<RevolutOrder> & Pick<RevolutOrder, 'id'>): RevolutOrder {
  return {
    state: 'completed',
    merchantOrderExtRef: null,
    metadata: {},
    checkoutUrl: null,
    ...overrides,
  };
}

describe('credit pack fulfilment webhook', () => {
  let db: TestDatabase;
  let credits: CreditsService;

  beforeAll(async () => {
    db = await startTestDatabase();
    credits = new CreditsService(db.prisma as unknown as PrismaService);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  function billingWith(getOrder: ReturnType<typeof vi.fn>): BillingService {
    const revolut = { getOrder } as unknown as RevolutService;
    return new BillingService(db.prisma as unknown as PrismaService, revolut);
  }

  it('invariant 22: the same ORDER_COMPLETED delivered twice credits the pack exactly once', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const getOrder = vi
      .fn()
      .mockResolvedValue(
        completedOrder({ id: 'ord_dup', metadata: { accountId: account.id, creditCents: 500 } }),
      );
    const billing = billingWith(getOrder);

    await billing.handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_dup',
      subscriptionId: null,
    });
    await billing.handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_dup',
      subscriptionId: null,
    });

    const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(updated.creditBalanceCents).toBe(500);

    const entries = await db.prisma.creditLedgerEntry.findMany({
      where: { accountId: account.id },
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      amountCents: 500,
      reason: 'PURCHASE',
      revolutOrderId: 'ord_dup',
    });
  });

  it('invariant 22: after a mixed sequence of grants, purchases and spends the balance equals the ledger sum', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const accountId = account.id;

    await db.prisma.$transaction((tx) => grantSignupCredits(tx, accountId));

    const getOrder = vi
      .fn()
      .mockResolvedValue(
        completedOrder({ id: 'ord_mixed', metadata: { accountId, creditCents: 500 } }),
      );
    const billing = billingWith(getOrder);
    await billing.handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_mixed',
      subscriptionId: null,
    });

    for (let i = 0; i < 2; i += 1) {
      const document = await db.prisma.document.create({
        data: { accountId, documentType: 'INVOICE' },
      });
      await db.prisma.$transaction((tx) => credits.chargeForIssuance(tx, accountId, document.id));
    }

    await billing.handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_mixed',
      subscriptionId: null,
    });

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

  it('ignores ORDER_COMPLETED events without creditCents in metadata', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const getOrder = vi
      .fn()
      .mockResolvedValue(
        completedOrder({ id: 'ord_no_credit', metadata: { accountId: account.id } }),
      );

    await billingWith(getOrder).handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_no_credit',
      subscriptionId: null,
    });

    const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(updated.creditBalanceCents).toBe(0);
    const entries = await db.prisma.creditLedgerEntry.count({ where: { accountId: account.id } });
    expect(entries).toBe(0);
  });

  it('ignores an order that has not reached the completed state', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const getOrder = vi.fn().mockResolvedValue(
      completedOrder({
        id: 'ord_pending',
        state: 'pending',
        metadata: { accountId: account.id, creditCents: 500 },
      }),
    );

    await billingWith(getOrder).handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_pending',
      subscriptionId: null,
    });

    const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(updated.creditBalanceCents).toBe(0);
  });
});
