import type { SubscriptionStatus } from '@shared/types';

const USABLE_STATUSES: readonly SubscriptionStatus[] = ['trialing', 'active'];

export function isSubscriptionUsable(status: SubscriptionStatus): boolean {
  return USABLE_STATUSES.includes(status);
}
