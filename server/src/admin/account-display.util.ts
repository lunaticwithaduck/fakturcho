import type { AccountSubscriptionStatus } from '@fakturcho/shared-types';
import type { IssuerProfile, Subscription } from '@prisma/client';
import { STATUS_TO_DTO } from '../billing/subscription-mapping';

export function accountDisplayName(
  issuerProfile: IssuerProfile | null,
  users: { email: string }[],
): string {
  return issuerProfile?.companyName ?? users[0]?.email ?? '';
}

export function firstUserEmail(users: { email: string }[]): string {
  return users[0]?.email ?? '';
}

export function toAccountSubscriptionStatus(
  subscription: Subscription | null,
): AccountSubscriptionStatus {
  return subscription ? STATUS_TO_DTO[subscription.status] : 'none';
}
