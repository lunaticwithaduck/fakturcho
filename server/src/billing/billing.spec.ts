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

function subscriptionUpdatedPayload(accountId: string): string {
  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return JSON.stringify({
    event_id: 'evt_1',
    event_type: 'subscription.updated',
    occurred_at: now,
    notification_id: 'ntf_1',
    data: {
      id: 'sub_123',
      status: 'active',
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

  beforeAll(async () => {
    process.env.PADDLE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.PADDLE_API_KEY = 'test-api-key';
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it('rejects a badly signed webhook', async () => {
    const paddle = new PaddleService();
    const rawBody = subscriptionUpdatedPayload('acc_placeholder');

    await expect(paddle.parseWebhook(rawBody, sign(rawBody, 'wrong-secret'))).rejects.toThrow(
      DomainError,
    );
  });

  it('updates the Subscription row from a signed subscription.updated event', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({ data: { accountId: account.id } });

    const paddle = new PaddleService();
    const rawBody = subscriptionUpdatedPayload(account.id);
    const event = await paddle.parseWebhook(rawBody, sign(rawBody, WEBHOOK_SECRET));

    const billing = new BillingService(db.prisma as unknown as PrismaService, paddle);
    await billing.handleWebhookEvent(event);

    const updated = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });
    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
    expect(updated.paddleSubscriptionId).toBe('sub_123');
    expect(updated.paddleCustomerId).toBe('ctm_123');
    expect(updated.currentPeriodEnd).not.toBeNull();
  });
});
