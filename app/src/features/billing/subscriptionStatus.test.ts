import { SUBSCRIPTION_STATUSES } from '@fakturcho/shared-types';
import bgMessages from '@messages/bg.json';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import {
  getSubscriptionStatusLabels,
  isSubscriptionUsable,
  type Translate,
} from './subscriptionStatus';

const t = createTranslator({
  locale: 'bg',
  messages: bgMessages,
  namespace: 'billing',
}) as unknown as Translate;

describe('isSubscriptionUsable', () => {
  it('treats a trialing subscription as not usable', () => {
    expect(isSubscriptionUsable('trialing')).toBe(false);
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

describe('getSubscriptionStatusLabels', () => {
  it('labels every subscription status in Bulgarian', () => {
    const labels = getSubscriptionStatusLabels(t);
    for (const status of SUBSCRIPTION_STATUSES) {
      expect(labels[status]).toBeTruthy();
    }
  });

  it('labels an active subscription', () => {
    expect(getSubscriptionStatusLabels(t).active).toBe('Активен');
  });

  it('labels a trialing subscription as awaiting payment', () => {
    expect(getSubscriptionStatusLabels(t).trialing).toBe('Чака плащане');
  });
});
