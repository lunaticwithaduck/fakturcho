import type { SubscriptionSummary } from '@fakturcho/shared-types';
import type { IssuerProfile, Subscription } from '@prisma/client';
import { STATUS_TO_DTO } from '../billing/subscription-mapping';
import { accountDisplayName } from './account-display.util';

export interface SubscriptionRow extends Subscription {
  account: { issuerProfile: IssuerProfile | null; users: { email: string }[] };
}

export function toSubscriptionSummary(row: SubscriptionRow): SubscriptionSummary {
  return {
    id: row.id,
    accountId: row.accountId,
    accountName: accountDisplayName(row.account.issuerProfile, row.account.users),
    status: STATUS_TO_DTO[row.status],
    planName: row.planId ?? '',
    mrrCents: 0,
    currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
