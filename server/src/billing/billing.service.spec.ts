import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { BillingService } from './billing.service';
import type { RevolutService } from './revolut.service';

describe('BillingService', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
    process.env.REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID = 'plan_var_test';
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  function serviceWith(revolut: RevolutService): BillingService {
    return new BillingService(db.prisma as unknown as PrismaService, revolut);
  }

  it('returns the account subscription as a DTO', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.subscription.create({ data: { accountId: account.id, status: 'ACTIVE' } });

    const revolut = {} as unknown as RevolutService;
    const dto = await serviceWith(revolut).getSubscription(account.id);
    expect(dto?.status).toBe('active');
    expect(dto?.currentPeriodEnd).toBeNull();
  });

  it('returns null when the account has no subscription row', async () => {
    const account = await db.prisma.account.create({ data: {} });

    const revolut = {} as unknown as RevolutService;
    expect(await serviceWith(revolut).getSubscription(account.id)).toBeNull();
  });

  it('creates a pack checkout with the pack face value and its own checkout url', async () => {
    const account = await db.prisma.account.create({ data: {} });

    const createCreditOrder = vi
      .fn()
      .mockResolvedValue({ id: 'ord_1', checkoutUrl: 'https://checkout.revolut.com/pay/ord_1' });
    const revolut = { createCreditOrder } as unknown as RevolutService;
    const service = serviceWith(revolut);

    const result = await service.createCheckout(account.id, 'pack5');
    expect(result.checkoutUrl).toBe('https://checkout.revolut.com/pay/ord_1');
    expect(createCreditOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 500, currency: 'EUR' }),
    );

    await service.createCheckout(account.id, 'pack25');
    expect(createCreditOrder).toHaveBeenLastCalledWith(
      expect.objectContaining({ amountCents: 2500 }),
    );
  });

  it('creates a customer once and a subscription checkout through the setup order', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.user.create({
      data: {
        id: `usr_${account.id}`,
        name: 'Тест Тестов',
        email: `${account.id}@example.com`,
        accountId: account.id,
      },
    });

    const createCustomer = vi.fn().mockResolvedValue({ id: 'cus_1' });
    const createSubscription = vi.fn().mockResolvedValue({
      id: 'sub_1',
      state: 'pending',
      setupOrderId: 'ord_setup',
      customerId: 'cus_1',
    });
    const getOrder = vi.fn().mockResolvedValue({
      id: 'ord_setup',
      state: 'pending',
      merchantOrderExtRef: null,
      metadata: {},
      checkoutUrl: 'https://checkout.revolut.com/pay/ord_setup',
    });
    const revolut = { createCustomer, createSubscription, getOrder } as unknown as RevolutService;

    const result = await serviceWith(revolut).createCheckout(account.id, 'subscription');
    expect(result.checkoutUrl).toBe('https://checkout.revolut.com/pay/ord_setup');
    expect(createCustomer).toHaveBeenCalledWith({
      fullName: 'Тест Тестов',
      email: `${account.id}@example.com`,
    });
    expect(createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ planVariationId: 'plan_var_test', customerId: 'cus_1' }),
    );

    const stored = await db.prisma.subscription.findUniqueOrThrow({
      where: { accountId: account.id },
    });
    expect(stored.revolutSubscriptionId).toBe('sub_1');
    expect(stored.revolutCustomerId).toBe('cus_1');
    expect(stored.status).toBe('TRIALING');

    await serviceWith(revolut).createCheckout(account.id, 'subscription');
    expect(createCustomer).toHaveBeenCalledTimes(1);
  });

  it('rejects a subscription checkout when the plan variation env is not set', async () => {
    delete process.env.REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID;
    const account = await db.prisma.account.create({ data: {} });
    const revolut = {} as unknown as RevolutService;

    await expect(
      serviceWith(revolut).createCheckout(account.id, 'subscription'),
    ).rejects.toMatchObject({
      code: 'CHECKOUT_NOT_CONFIGURED',
    });
    process.env.REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID = 'plan_var_test';
  });
});
