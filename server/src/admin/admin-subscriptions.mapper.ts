import type { SubscriptionSummary } from '@fakturcho/shared-types';
import { SUBSCRIPTION_PRICE_CENTS } from '@fakturcho/shared-types';
import type { IssuerProfile, Subscription } from '@prisma/client';
import { STATUS_TO_DTO } from '../billing/subscription-mapping';
import { accountDisplayName } from './account-display.util';

export interface SubscriptionRow extends Subscription {
  account: { issuerProfile: IssuerProfile | null; users: { email: string }[] };
}

export function toSubscriptionSummary(row: SubscriptionRow): SubscriptionSummary {
  const status = STATUS_TO_DTO[row.status];
  return {
    id: row.id,
    accountId: row.accountId,
    accountName: accountDisplayName(row.account.issuerProfile, row.account.users),
    status,
    planName: row.planId ?? '',
    mrrCents: status === 'active' ? SUBSCRIPTION_PRICE_CENTS : 0,
    currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
