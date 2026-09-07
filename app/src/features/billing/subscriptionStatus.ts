import type { SubscriptionStatus } from '@shared/types';

const USABLE_STATUSES: readonly SubscriptionStatus[] = ['trialing', 'active'];

export function isSubscriptionUsable(status: SubscriptionStatus): boolean {
  return USABLE_STATUSES.includes(status);
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: 'Пробен период',
  active: 'Активен',
  past_due: 'Просрочено плащане',
  canceled: 'Прекратен',
};
