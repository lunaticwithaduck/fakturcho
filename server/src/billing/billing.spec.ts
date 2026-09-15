import { createHmac } from 'node:crypto';
import { SubscriptionStatus } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { BillingService } from './billing.service';
import { RevolutService } from './revolut.service';

const WEBHOOK_SECRET = 'test-webhook-secret';

function sign(rawBody: string, secret: string, timestamp: string): string {
  const hmac = createHmac('sha256', secret).update(`v1.${timestamp}.${rawBody}`).digest('hex');
  return `v1=${hmac}`;
}

describe('Revolut webhook signature verification', () => {
  let db: TestDatabase;
  let revolut: RevolutService;

  beforeAll(async () => {
    process.env.REVOLUT_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.REVOLUT_API_KEY = 'sk_test';
    db = await startTestDatabase();
    revolut = new RevolutService();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('accepts a correctly signed payload', () => {
    const rawBody = JSON.stringify({ event: 'ORDER_COMPLETED', order_id: 'ord_1' });
    const timestamp = String(Date.now());
    expect(
      revolut.verifyWebhookSignature(rawBody, timestamp, sign(rawBody, WEBHOOK_SECRET, timestamp)),
    ).toBe(true);
  });

  it('rejects a badly signed payload', () => {
    const rawBody = JSON.stringify({ event: 'ORDER_COMPLETED', order_id: 'ord_1' });
    const timestamp = String(Date.now());
    expect(
      revolut.verifyWebhookSignature(rawBody, timestamp, sign(rawBody, 'wrong-secret', timestamp)),
    ).toBe(false);
  });

  it('accepts a match anywhere in a comma-separated rotation header', () => {
    const rawBody = JSON.stringify({ event: 'ORDER_COMPLETED', order_id: 'ord_1' });
    const timestamp = String(Date.now());
    const header = `v1=deadbeef, ${sign(rawBody, WEBHOOK_SECRET, timestamp)}`;
    expect(revolut.verifyWebhookSignature(rawBody, timestamp, header)).toBe(true);
  });

  it('rejects a payload signed with a different timestamp than the header carries', () => {
    const rawBody = JSON.stringify({ event: 'ORDER_COMPLETED', order_id: 'ord_1' });
    const signed = sign(rawBody, WEBHOOK_SECRET, '1000');
    expect(revolut.verifyWebhookSignature(rawBody, '2000', signed)).toBe(false);
  });
});

describe('subscription webhook status mapping', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  function billingWith(getSubscription: ReturnType<typeof vi.fn>): BillingService {
    const revolut = { getSubscription } as unknown as RevolutService;
    return new BillingService(db.prisma as unknown as PrismaService, revolut);
  }

  it('SUBSCRIPTION_INITIATED refreshes the row to active', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({
      data: { accountId: account.id, status: 'TRIALING', revolutSubscriptionId: 'sub_1' },
    });

    const getSubscription = vi
      .fn()
      .mockResolvedValue({ id: 'sub_1', state: 'active', setupOrderId: null, customerId: 'cus_1' });

    await billingWith(getSubscription).handleWebhookEvent({
      event: 'SUBSCRIPTION_INITIATED',
      orderId: null,
      subscriptionId: 'sub_1',
    });

    const updated = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });
    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('SUBSCRIPTION_OVERDUE moves the row to past_due', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({
      data: { accountId: account.id, status: 'ACTIVE', revolutSubscriptionId: 'sub_2' },
    });

    const getSubscription = vi.fn().mockResolvedValue({
      id: 'sub_2',
      state: 'overdue',
      setupOrderId: null,
      customerId: 'cus_1',
    });

    await billingWith(getSubscription).handleWebhookEvent({
      event: 'SUBSCRIPTION_OVERDUE',
      orderId: null,
      subscriptionId: 'sub_2',
    });

    const updated = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });
    expect(updated.status).toBe(SubscriptionStatus.PAST_DUE);
  });

  it('SUBSCRIPTION_CANCELLED moves the row to canceled', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({
      data: { accountId: account.id, status: 'ACTIVE', revolutSubscriptionId: 'sub_3' },
    });

    const getSubscription = vi.fn().mockResolvedValue({
      id: 'sub_3',
      state: 'cancelled',
      setupOrderId: null,
      customerId: 'cus_1',
    });

    await billingWith(getSubscription).handleWebhookEvent({
      event: 'SUBSCRIPTION_CANCELLED',
      orderId: null,
      subscriptionId: 'sub_3',
    });

    const updated = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });
    expect(updated.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('ignores a subscription event for an id with no matching row', async () => {
    const getSubscription = vi.fn();
    await billingWith(getSubscription).handleWebhookEvent({
      event: 'SUBSCRIPTION_OVERDUE',
      orderId: null,
      subscriptionId: 'sub_missing',
    });
    expect(getSubscription).not.toHaveBeenCalled();
  });

  it('ignores an unrecognised event', async () => {
    const getSubscription = vi.fn();
    await billingWith(getSubscription).handleWebhookEvent({
      event: 'ORDER_AUTHORISED',
      orderId: 'ord_1',
      subscriptionId: null,
    });
    expect(getSubscription).not.toHaveBeenCalled();
  });

  it('SUBSCRIPTION_INITIATED also stores the current cycle end date', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({
      data: { accountId: account.id, status: 'TRIALING', revolutSubscriptionId: 'sub_period' },
    });

    const getSubscription = vi.fn().mockResolvedValue({
      id: 'sub_period',
      state: 'active',
      setupOrderId: null,
      customerId: 'c',
    });
    const getCurrentPeriodEnd = vi.fn().mockResolvedValue(new Date('2026-10-15T00:00:00.000Z'));
    const revolut = { getSubscription, getCurrentPeriodEnd } as unknown as RevolutService;

    await new BillingService(db.prisma as unknown as PrismaService, revolut).handleWebhookEvent({
      event: 'SUBSCRIPTION_INITIATED',
      orderId: null,
      subscriptionId: 'sub_period',
    });

    const updated = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });
    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
    expect(updated.currentPeriodEnd).toEqual(new Date('2026-10-15T00:00:00.000Z'));
    expect(getCurrentPeriodEnd).toHaveBeenCalledWith('sub_period');
  });
});

describe('pending upgrade activation', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
    process.env.REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID = 'activation-sub5';
    process.env.REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID_10 = 'activation-sub10';
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  async function createUpgradingAccount(suffix: string) {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({
      data: {
        accountId: account.id,
        status: 'ACTIVE',
        planId: 'activation-sub5',
        revolutSubscriptionId: `sub_old_active_${suffix}`,
        revolutCustomerId: 'cus_1',
        pendingPlanId: 'activation-sub10',
        pendingRevolutSubscriptionId: `sub_new_pending_${suffix}`,
        pendingRevolutSetupOrderId: `ord_setup_pending_${suffix}`,
        pendingCheckoutUrl: `https://checkout.revolut.com/pay/ord_setup_pending_${suffix}`,
        pendingCheckoutStartedAt: new Date(),
      },
    });
    return account.id;
  }

  it('ORDER_COMPLETED for the pending upgrade cancels the old plan, promotes the new one and grants once', async () => {
    const accountId = await createUpgradingAccount('a');
    const cancelSubscription = vi.fn().mockResolvedValue(undefined);
    const getCurrentPeriodEnd = vi.fn().mockResolvedValue(new Date('2026-11-01T00:00:00.000Z'));
    const getOrder = vi.fn().mockResolvedValue({
      id: 'ord_upgrade_paid',
      state: 'completed',
      amount: 1000,
      merchantOrderExtRef: null,
      metadata: {},
      checkoutUrl: null,
      subscriptionId: 'sub_new_pending_a',
    });
    const revolut = {
      getOrder,
      cancelSubscription,
      getCurrentPeriodEnd,
    } as unknown as RevolutService;
    const billing = new BillingService(db.prisma as unknown as PrismaService, revolut);

    await billing.handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_upgrade_paid',
      subscriptionId: null,
    });

    expect(cancelSubscription).toHaveBeenCalledWith('sub_old_active_a');
    const stored = await db.prisma.subscription.findUniqueOrThrow({ where: { accountId } });
    expect(stored.status).toBe(SubscriptionStatus.ACTIVE);
    expect(stored.planId).toBe('activation-sub10');
    expect(stored.revolutSubscriptionId).toBe('sub_new_pending_a');
    expect(stored.currentPeriodEnd).toEqual(new Date('2026-11-01T00:00:00.000Z'));
    expect(stored.pendingPlanId).toBeNull();
    expect(stored.pendingRevolutSubscriptionId).toBeNull();

    const account = await db.prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    expect(account.creditBalanceCents).toBe(2000);
    const entries = await db.prisma.creditLedgerEntry.count({ where: { accountId } });
    expect(entries).toBe(1);
  });

  it('a replayed ORDER_COMPLETED for the same upgrade never grants twice', async () => {
    const accountId = await createUpgradingAccount('b');
    const cancelSubscription = vi.fn().mockResolvedValue(undefined);
    const getCurrentPeriodEnd = vi.fn().mockResolvedValue(null);
    const getOrder = vi.fn().mockResolvedValue({
      id: 'ord_upgrade_replay',
      state: 'completed',
      amount: 1000,
      merchantOrderExtRef: null,
      metadata: {},
      checkoutUrl: null,
      subscriptionId: 'sub_new_pending_b',
    });
    const revolut = {
      getOrder,
      cancelSubscription,
      getCurrentPeriodEnd,
    } as unknown as RevolutService;
    const billing = new BillingService(db.prisma as unknown as PrismaService, revolut);

    await billing.handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_upgrade_replay',
      subscriptionId: null,
    });
    await billing.handleWebhookEvent({
      event: 'ORDER_COMPLETED',
      orderId: 'ord_upgrade_replay',
      subscriptionId: null,
    });

    const account = await db.prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    expect(account.creditBalanceCents).toBe(2000);
    const entries = await db.prisma.creditLedgerEntry.count({ where: { accountId } });
    expect(entries).toBe(1);
    // the second delivery re-runs activation on an already-promoted row: cancel is idempotent too
    expect(cancelSubscription).toHaveBeenCalledTimes(1);
  });

  it('SUBSCRIPTION_CANCELLED for the pending upgrade clears it without touching the active plan', async () => {
    const accountId = await createUpgradingAccount('c');
    const getSubscriptionOrNull = vi.fn().mockResolvedValue({
      id: 'sub_new_pending_c',
      state: 'cancelled',
      setupOrderId: null,
      customerId: 'cus_1',
    });
    const revolut = { getSubscriptionOrNull } as unknown as RevolutService;
    const billing = new BillingService(db.prisma as unknown as PrismaService, revolut);

    await billing.handleWebhookEvent({
      event: 'SUBSCRIPTION_CANCELLED',
      orderId: null,
      subscriptionId: 'sub_new_pending_c',
    });

    const stored = await db.prisma.subscription.findUniqueOrThrow({ where: { accountId } });
    expect(stored.status).toBe(SubscriptionStatus.ACTIVE);
    expect(stored.planId).toBe('activation-sub5');
    expect(stored.revolutSubscriptionId).toBe('sub_old_active_c');
    expect(stored.pendingRevolutSubscriptionId).toBeNull();
    expect(stored.pendingPlanId).toBeNull();
  });
});
