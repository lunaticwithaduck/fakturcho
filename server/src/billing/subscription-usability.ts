import type { Subscription } from '@prisma/client';
import { SubscriptionStatus } from '@prisma/client';

export function isSubscriptionUsable(subscription: Subscription | null | undefined): boolean {
  if (!subscription) return false;
  if (subscription.status === SubscriptionStatus.ACTIVE) return true;
  return (
    subscription.status === SubscriptionStatus.TRIALING &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd.getTime() > Date.now()
  );
}
