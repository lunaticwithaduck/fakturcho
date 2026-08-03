import type { SubscriptionStatus } from './enums';

export interface SubscriptionDto {
  id: string;
  status: SubscriptionStatus;
  planId: string | null;
  currentPeriodEnd: string | null;
}

export interface CheckoutSessionDto {
  checkoutUrl: string;
}
