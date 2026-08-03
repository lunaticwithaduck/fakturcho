import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { BillingService } from './billing.service';
import type { PaddleService } from './paddle.service';

describe('BillingService', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it('returns the account subscription as a DTO', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({ data: { accountId: account.id } });

    const paddle = { createCheckoutTransaction: vi.fn() } as unknown as PaddleService;
    const service = new BillingService(db.prisma as unknown as PrismaService, paddle);

    const dto = await service.getSubscription(account.id);
    expect(dto.status).toBe('trialing');
    expect(dto.currentPeriodEnd).toBeNull();
  });

  it('creates a checkout session via Paddle', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({ data: { accountId: account.id } });
    process.env.PADDLE_PRICE_ID = 'pri_test';

    const createCheckoutTransaction = vi.fn().mockResolvedValue('https://checkout.paddle.com/abc');
    const paddle = { createCheckoutTransaction } as unknown as PaddleService;
    const service = new BillingService(db.prisma as unknown as PrismaService, paddle);

    const result = await service.createCheckout(account.id);
    expect(result.checkoutUrl).toBe('https://checkout.paddle.com/abc');
    expect(createCheckoutTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: 'pri_test', accountId: account.id }),
    );
  });
});
