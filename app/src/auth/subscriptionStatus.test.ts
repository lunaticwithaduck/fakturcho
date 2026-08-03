import { describe, expect, it } from 'vitest';
import { isSubscriptionUsable } from './subscriptionStatus';

describe('isSubscriptionUsable', () => {
  it('allows access during the trial', () => {
    expect(isSubscriptionUsable('trialing')).toBe(true);
  });

  it('allows access when the subscription is active', () => {
    expect(isSubscriptionUsable('active')).toBe(true);
  });

  it('blocks access when payment is past due', () => {
    expect(isSubscriptionUsable('past_due')).toBe(false);
  });

  it('blocks access once the subscription is canceled', () => {
    expect(isSubscriptionUsable('canceled')).toBe(false);
  });
});
