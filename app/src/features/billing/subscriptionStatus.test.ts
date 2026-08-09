import { SUBSCRIPTION_STATUSES } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { isSubscriptionUsable, SUBSCRIPTION_STATUS_LABELS } from './subscriptionStatus';

describe('isSubscriptionUsable', () => {
  it('treats a trialing subscription as usable', () => {
    expect(isSubscriptionUsable('trialing')).toBe(true);
  });

  it('treats an active subscription as usable', () => {
    expect(isSubscriptionUsable('active')).toBe(true);
  });

  it('treats a past due subscription as not usable', () => {
    expect(isSubscriptionUsable('past_due')).toBe(false);
  });

  it('treats a canceled subscription as not usable', () => {
    expect(isSubscriptionUsable('canceled')).toBe(false);
  });
});

describe('SUBSCRIPTION_STATUS_LABELS', () => {
  it('labels every subscription status in Bulgarian', () => {
    for (const status of SUBSCRIPTION_STATUSES) {
      expect(SUBSCRIPTION_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('labels an active subscription', () => {
    expect(SUBSCRIPTION_STATUS_LABELS.active).toBe('Активен');
  });
});
