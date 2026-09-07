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
});
