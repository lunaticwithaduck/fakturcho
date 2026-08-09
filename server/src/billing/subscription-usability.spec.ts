import type { Subscription } from '@prisma/client';
import { SubscriptionStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { isSubscriptionUsable } from './subscription-usability';

function subscription(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'sub_1',
    accountId: 'acc_1',
    status: SubscriptionStatus.ACTIVE,
    paddleSubscriptionId: null,
    paddleCustomerId: null,
    planId: null,
    currentPeriodEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('isSubscriptionUsable', () => {
  it('no subscription row is not usable', () => {
    expect(isSubscriptionUsable(null)).toBe(false);
    expect(isSubscriptionUsable(undefined)).toBe(false);
  });

  it('ACTIVE is usable regardless of period end', () => {
    expect(isSubscriptionUsable(subscription({ status: SubscriptionStatus.ACTIVE }))).toBe(true);
    expect(
      isSubscriptionUsable(
        subscription({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: new Date(0) }),
      ),
    ).toBe(true);
  });

  it('TRIALING is usable only with a period end strictly in the future', () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    expect(
      isSubscriptionUsable(
        subscription({ status: SubscriptionStatus.TRIALING, currentPeriodEnd: future }),
      ),
    ).toBe(true);
    expect(
      isSubscriptionUsable(
        subscription({ status: SubscriptionStatus.TRIALING, currentPeriodEnd: past }),
      ),
    ).toBe(false);
    expect(
      isSubscriptionUsable(
        subscription({ status: SubscriptionStatus.TRIALING, currentPeriodEnd: null }),
      ),
    ).toBe(false);
  });

  it('PAST_DUE and CANCELED are never usable', () => {
    const future = new Date(Date.now() + 60_000);
    expect(
      isSubscriptionUsable(
        subscription({ status: SubscriptionStatus.PAST_DUE, currentPeriodEnd: future }),
      ),
    ).toBe(false);
    expect(
      isSubscriptionUsable(
        subscription({ status: SubscriptionStatus.CANCELED, currentPeriodEnd: future }),
      ),
    ).toBe(false);
  });
});
