import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { BillingService } from './billing.service';
import type { PaddleService } from './paddle.service';

describe('BillingService', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
    process.env.PADDLE_SUBSCRIPTION_PRICE_ID = 'pri_sub_test';
    process.env.PADDLE_PRICE_PACK5 = 'pri_pack5_test';
    process.env.PADDLE_PRICE_PACK10 = 'pri_pack10_test';
    process.env.PADDLE_PRICE_PACK25 = 'pri_pack25_test';
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  function serviceWith(paddle: PaddleService): BillingService {
    return new BillingService(db.prisma as unknown as PrismaService, paddle);
  }

  it('returns the account subscription as a DTO', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({ data: { accountId: account.id, status: 'ACTIVE' } });

    const paddle = { createCheckoutTransaction: vi.fn() } as unknown as PaddleService;
    const dto = await serviceWith(paddle).getSubscription(account.id);
    expect(dto?.status).toBe('active');
    expect(dto?.currentPeriodEnd).toBeNull();
  });

  it('returns null when the account has no subscription row', async () => {
    const account = await db.prisma.account.create({ data: {} });

    const paddle = { createCheckoutTransaction: vi.fn() } as unknown as PaddleService;
    expect(await serviceWith(paddle).getSubscription(account.id)).toBeNull();
  });

  it('creates a subscription checkout with the subscription price and no creditCents', async () => {
    const account = await db.prisma.account.create({ data: {} });

    const createCheckoutTransaction = vi.fn().mockResolvedValue('https://checkout.paddle.com/abc');
    const paddle = { createCheckoutTransaction } as unknown as PaddleService;

    const result = await serviceWith(paddle).createCheckout(account.id, 'subscription');
    expect(result.checkoutUrl).toBe('https://checkout.paddle.com/abc');
    expect(createCheckoutTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        priceId: 'pri_sub_test',
        accountId: account.id,
        creditCents: null,
      }),
    );
  });

  it('creates a pack checkout with the pack price and its face value as creditCents', async () => {
    const account = await db.prisma.account.create({ data: {} });

    const createCheckoutTransaction = vi.fn().mockResolvedValue('https://checkout.paddle.com/def');
    const paddle = { createCheckoutTransaction } as unknown as PaddleService;
    const service = serviceWith(paddle);

    await service.createCheckout(account.id, 'pack5');
    expect(createCheckoutTransaction).toHaveBeenLastCalledWith(
      expect.objectContaining({ priceId: 'pri_pack5_test', creditCents: 500 }),
    );

    await service.createCheckout(account.id, 'pack25');
    expect(createCheckoutTransaction).toHaveBeenLastCalledWith(
      expect.objectContaining({ priceId: 'pri_pack25_test', creditCents: 2500 }),
    );
  });
});
