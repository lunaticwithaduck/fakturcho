import type {
  SubscriptionStatus as SharedSubscriptionStatus,
  SubscriptionDto,
} from '@fakturcho/shared-types';
import type { Subscription } from '@prisma/client';
import { SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';

export const STATUS_TO_DTO: Record<PrismaSubscriptionStatus, SharedSubscriptionStatus> = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
};

export const REVOLUT_STATE_TO_PRISMA: Record<string, PrismaSubscriptionStatus> = {
  pending: PrismaSubscriptionStatus.TRIALING,
  active: PrismaSubscriptionStatus.ACTIVE,
  overdue: PrismaSubscriptionStatus.PAST_DUE,
  paused: PrismaSubscriptionStatus.PAST_DUE,
  cancelled: PrismaSubscriptionStatus.CANCELED,
  finished: PrismaSubscriptionStatus.CANCELED,
};

export function toSubscriptionDto(subscription: Subscription): SubscriptionDto {
  return {
    id: subscription.id,
    status: STATUS_TO_DTO[subscription.status],
    planId: subscription.planId,
    currentPeriodEnd: subscription.currentPeriodEnd
      ? subscription.currentPeriodEnd.toISOString()
      : null,
  };
}
