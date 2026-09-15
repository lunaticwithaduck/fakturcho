import { SubscriptionStatus } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import type { RevolutService } from './revolut.service';
import { expireStalePendingSubscriptions, PENDING_CHECKOUT_TTL_MS } from './subscription-expiry';

const HOUR = 60 * 60 * 1000;

describe('expireStalePendingSubscriptions', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.prisma.subscription.deleteMany();
  });

  function prisma(): PrismaService {
    return db.prisma as unknown as PrismaService;
  }

  async function createSubscription(overrides: {
    status?: SubscriptionStatus;
    revolutSubscriptionId?: string | null;
    checkoutStartedAt?: Date | null;
    updatedAt?: Date;
    checkoutUrl?: string | null;
  }): Promise<string> {
    const account = await db.prisma.account.create({ data: {} });
    const row = await db.prisma.subscription.create({
      data: {
        accountId: account.id,
        status: overrides.status ?? SubscriptionStatus.TRIALING,
        revolutSubscriptionId:
          'revolutSubscriptionId' in overrides ? overrides.revolutSubscriptionId : 'sub_x',
        checkoutUrl: overrides.checkoutUrl ?? 'https://checkout.revolut.com/pay/ord_x',
        ...('checkoutStartedAt' in overrides
          ? { checkoutStartedAt: overrides.checkoutStartedAt }
          : {}),
        ...(overrides.updatedAt ? { updatedAt: overrides.updatedAt } : {}),
      },
    });
    return row.id;
  }

  it('cancels a stale pending subscription at Revolut and marks the row CANCELED', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const staleSince = new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS - HOUR);
    const id = await createSubscription({ checkoutStartedAt: staleSince });

    const getSubscriptionOrNull = vi.fn().mockResolvedValue({
      id: 'sub_x',
      state: 'pending',
      setupOrderId: null,
      customerId: 'cus_1',
    });
    const cancelSubscription = vi.fn().mockResolvedValue(undefined);
    const revolut = { getSubscriptionOrNull, cancelSubscription } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    expect(cancelSubscription).toHaveBeenCalledWith('sub_x');
    const row = await db.prisma.subscription.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe(SubscriptionStatus.CANCELED);
    expect(row.checkoutUrl).toBeNull();
  });

  it('leaves a fresh pending subscription untouched', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const fresh = new Date(now.getTime() - HOUR);
    const id = await createSubscription({ checkoutStartedAt: fresh });

    const getSubscriptionOrNull = vi.fn();
    const cancelSubscription = vi.fn();
    const revolut = { getSubscriptionOrNull, cancelSubscription } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    expect(getSubscriptionOrNull).not.toHaveBeenCalled();
    const row = await db.prisma.subscription.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe(SubscriptionStatus.TRIALING);
  });

  it('syncs to ACTIVE instead of cancelling when Revolut says the payment landed', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const staleSince = new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS - HOUR);
    const id = await createSubscription({ checkoutStartedAt: staleSince });

    const getSubscriptionOrNull = vi
      .fn()
      .mockResolvedValue({ id: 'sub_x', state: 'active', setupOrderId: null, customerId: 'cus_1' });
    const cancelSubscription = vi.fn();
    const revolut = { getSubscriptionOrNull, cancelSubscription } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    expect(cancelSubscription).not.toHaveBeenCalled();
    const row = await db.prisma.subscription.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('marks CANCELED when Revolut no longer has the subscription (404)', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const staleSince = new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS - HOUR);
    const id = await createSubscription({ checkoutStartedAt: staleSince });

    const getSubscriptionOrNull = vi.fn().mockResolvedValue(null);
    const cancelSubscription = vi.fn();
    const revolut = { getSubscriptionOrNull, cancelSubscription } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    expect(cancelSubscription).not.toHaveBeenCalled();
    const row = await db.prisma.subscription.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('marks CANCELED when Revolut reports the subscription as cancelled', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const staleSince = new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS - HOUR);
    const id = await createSubscription({ checkoutStartedAt: staleSince });

    const getSubscriptionOrNull = vi.fn().mockResolvedValue({
      id: 'sub_x',
      state: 'cancelled',
      setupOrderId: null,
      customerId: 'cus_1',
    });
    const cancelSubscription = vi.fn();
    const revolut = { getSubscriptionOrNull, cancelSubscription } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    expect(cancelSubscription).not.toHaveBeenCalled();
    const row = await db.prisma.subscription.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('marks CANCELED locally without calling Revolut when there is no stored subscription id', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const staleSince = new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS - HOUR);
    const id = await createSubscription({
      checkoutStartedAt: staleSince,
      revolutSubscriptionId: null,
    });

    const getSubscriptionOrNull = vi.fn();
    const revolut = { getSubscriptionOrNull } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    expect(getSubscriptionOrNull).not.toHaveBeenCalled();
    const row = await db.prisma.subscription.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('a Revolut error on one row is logged and does not block the others', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const staleSince = new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS - HOUR);
    const brokenId = await createSubscription({
      checkoutStartedAt: staleSince,
      revolutSubscriptionId: 'sub_broken',
    });
    const okId = await createSubscription({
      checkoutStartedAt: staleSince,
      revolutSubscriptionId: 'sub_ok',
    });

    const getSubscriptionOrNull = vi.fn().mockImplementation((id: string) => {
      if (id === 'sub_broken') return Promise.reject(new Error('revolut unreachable'));
      return Promise.resolve({
        id: 'sub_ok',
        state: 'pending',
        setupOrderId: null,
        customerId: 'cus_1',
      });
    });
    const cancelSubscription = vi.fn().mockResolvedValue(undefined);
    const revolut = { getSubscriptionOrNull, cancelSubscription } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    const broken = await db.prisma.subscription.findUniqueOrThrow({ where: { id: brokenId } });
    expect(broken.status).toBe(SubscriptionStatus.TRIALING);
    const ok = await db.prisma.subscription.findUniqueOrThrow({ where: { id: okId } });
    expect(ok.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('falls back to updatedAt when checkoutStartedAt is null', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const staleUpdatedAt = new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS - HOUR);
    const id = await createSubscription({ checkoutStartedAt: null, updatedAt: staleUpdatedAt });

    const getSubscriptionOrNull = vi.fn().mockResolvedValue({
      id: 'sub_x',
      state: 'pending',
      setupOrderId: null,
      customerId: 'cus_1',
    });
    const cancelSubscription = vi.fn().mockResolvedValue(undefined);
    const revolut = { getSubscriptionOrNull, cancelSubscription } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    const row = await db.prisma.subscription.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('never touches ACTIVE, PAST_DUE or CANCELED rows regardless of age', async () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const staleSince = new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS - HOUR);
    const activeId = await createSubscription({
      status: SubscriptionStatus.ACTIVE,
      revolutSubscriptionId: 'sub_active',
      checkoutStartedAt: staleSince,
    });
    const pastDueId = await createSubscription({
      status: SubscriptionStatus.PAST_DUE,
      revolutSubscriptionId: 'sub_past_due',
      checkoutStartedAt: staleSince,
    });
    const canceledId = await createSubscription({
      status: SubscriptionStatus.CANCELED,
      revolutSubscriptionId: 'sub_canceled',
      checkoutStartedAt: staleSince,
    });

    const getSubscriptionOrNull = vi.fn();
    const cancelSubscription = vi.fn();
    const revolut = { getSubscriptionOrNull, cancelSubscription } as unknown as RevolutService;

    await expireStalePendingSubscriptions(prisma(), revolut, now);

    expect(getSubscriptionOrNull).not.toHaveBeenCalled();
    expect(cancelSubscription).not.toHaveBeenCalled();
    const active = await db.prisma.subscription.findUniqueOrThrow({ where: { id: activeId } });
    const pastDue = await db.prisma.subscription.findUniqueOrThrow({ where: { id: pastDueId } });
    const canceled = await db.prisma.subscription.findUniqueOrThrow({ where: { id: canceledId } });
    expect(active.status).toBe(SubscriptionStatus.ACTIVE);
    expect(pastDue.status).toBe(SubscriptionStatus.PAST_DUE);
    expect(canceled.status).toBe(SubscriptionStatus.CANCELED);
  });
});
