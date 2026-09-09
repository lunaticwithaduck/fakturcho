import type { SubscriptionStatus } from '@shared/types';
import type { useTranslations } from 'next-intl';

export type Translate = ReturnType<typeof useTranslations>;

const USABLE_STATUSES: readonly SubscriptionStatus[] = ['active'];

export function isSubscriptionUsable(status: SubscriptionStatus): boolean {
  return USABLE_STATUSES.includes(status);
}

export function getSubscriptionStatusLabels(t: Translate): Record<SubscriptionStatus, string> {
  return {
    trialing: t('subscriptionStatus.trialing'),
    active: t('subscriptionStatus.active'),
    past_due: t('subscriptionStatus.pastDue'),
    canceled: t('subscriptionStatus.canceled'),
  };
}
