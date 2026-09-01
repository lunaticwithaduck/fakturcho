import { createHmac } from 'node:crypto';
import { SubscriptionStatus } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { BillingService } from './billing.service';
import { PaddleService } from './paddle.service';

const WEBHOOK_SECRET = 'test-webhook-secret';

function sign(rawBody: string, secret: string, ts = Math.floor(Date.now() / 1000)): string {
  const hmac = createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex');
  return `ts=${ts};h1=${hmac}`;
}

function subscriptionPayload(
  accountId: string,
  eventType = 'subscription.updated',
  status = 'active',
  subscriptionId = 'sub_123',
): string {
  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return JSON.stringify({
    event_id: 'evt_1',
    event_type: eventType,
    occurred_at: now,
    notification_id: 'ntf_1',
    data: {
      id: subscriptionId,
      status,
      customer_id: 'ctm_123',
      address_id: 'add_1',
      business_id: null,
      currency_code: 'EUR',
      created_at: now,
      updated_at: now,
      started_at: null,
      first_billed_at: null,
      next_billed_at: null,
      paused_at: null,
      canceled_at: null,
      discount: null,
      collection_mode: 'automatic',
      billing_details: null,
      current_billing_period: { starts_at: now, ends_at: periodEnd },
      billing_cycle: { interval: 'month', frequency: 1 },
      scheduled_change: null,
      items: [],
      custom_data: { accountId },
      import_meta: null,
    },
  });
}

describe('Paddle billing webhook', () => {
  let db: TestDatabase;
  let paddle: PaddleService;
  let billing: BillingService;

  beforeAll(async () => {
    process.env.PADDLE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.PADDLE_API_KEY = 'test-api-key';
    db = await startTestDatabase();
    paddle = new PaddleService();
    billing = new BillingService(db.prisma as unknown as PrismaService, paddle);
  });

  afterAll(async () => {
    await db.stop();
  });

  async function deliver(rawBody: string): Promise<void> {
    const event = await paddle.parseWebhook(rawBody, sign(rawBody, WEBHOOK_SECRET));
    await billing.handleWebhookEvent(event);
  }

  it('rejects a badly signed webhook', async () => {
    const rawBody = subscriptionPayload('acc_placeholder');

    await expect(paddle.parseWebhook(rawBody, sign(rawBody, 'wrong-secret'))).rejects.toThrow(
      DomainError,
    );
  });

  it('creates the Subscription row from a signed subscription.created event when none exists', async () => {
    const account = await db.prisma.account.create({ data: {} });

    await deliver(subscriptionPayload(account.id, 'subscription.created', 'active'));

    const created = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });
    expect(created.status).toBe(SubscriptionStatus.ACTIVE);
    expect(created.paddleSubscriptionId).toBe('sub_123');
    expect(created.paddleCustomerId).toBe('ctm_123');
    expect(created.currentPeriodEnd).not.toBeNull();
  });

  it('updates the existing Subscription row on a later event, keeping the same row', async () => {
    const account = await db.prisma.account.create({ data: {} });

    await deliver(subscriptionPayload(account.id, 'subscription.created', 'active', 'sub_456'));
    const created = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });

    await deliver(subscriptionPayload(account.id, 'subscription.canceled', 'canceled', 'sub_456'));
    const updated = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });
    expect(updated.id).toBe(created.id);
    expect(updated.status).toBe(SubscriptionStatus.CANCELED);
  });
});
