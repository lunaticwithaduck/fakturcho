import type { AccountDetail, AccountSummary } from '@fakturcho/shared-types';
import type { Account, IssuerProfile, Subscription } from '@prisma/client';
import {
  accountDisplayName,
  firstUserEmail,
  toAccountSubscriptionStatus,
} from './account-display.util';

export interface AccountRow extends Account {
  issuerProfile: IssuerProfile | null;
  subscription: Subscription | null;
  users: { email: string }[];
  _count: { documents: number };
}

export function toAccountSummary(row: AccountRow): AccountSummary {
  return {
    id: row.id,
    companyName: accountDisplayName(row.issuerProfile, row.users),
    eik: row.issuerProfile?.eik ?? '',
    city: row.issuerProfile?.city ?? '',
    vatRegistered: row.issuerProfile?.vatRegistered ?? false,
    documentsIssued: row._count.documents,
    subscriptionStatus: toAccountSubscriptionStatus(row.subscription),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAccountDetail(row: AccountRow): AccountDetail {
  return {
    ...toAccountSummary(row),
    addressLine: row.issuerProfile?.addressLine ?? '',
    vatNumber: row.issuerProfile?.vatNumber ?? null,
    mol: row.issuerProfile?.mol ?? '',
    phone: row.issuerProfile?.phone ?? '',
    email: firstUserEmail(row.users),
    iban: row.issuerProfile?.iban ?? '',
    bic: row.issuerProfile?.bic ?? '',
    planName: row.subscription?.planId ?? '',
    mrrCents: 0,
    currentPeriodEnd: row.subscription?.currentPeriodEnd
      ? row.subscription.currentPeriodEnd.toISOString()
      : null,
    creditBalanceCents: row.creditBalanceCents,
  };
}
