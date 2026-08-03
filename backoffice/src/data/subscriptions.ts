import type {
  AccountDetail,
  MrrSummary,
  SubscriptionStatusFilter,
  SubscriptionSummary,
} from '../types/admin';
import { getAllAccounts } from './accounts';

function toSubscription(account: AccountDetail): SubscriptionSummary {
  return {
    id: `sub-${account.id}`,
    accountId: account.id,
    accountName: account.companyName,
    status: account.subscriptionStatus,
    planName: account.planName,
    mrrCents: account.mrrCents,
    currentPeriodEnd: account.currentPeriodEnd,
    createdAt: account.createdAt,
  };
}

export function listSubscriptions(status: SubscriptionStatusFilter): SubscriptionSummary[] {
  const subscriptions = getAllAccounts().map(toSubscription);
  if (status === 'all') return subscriptions;
  return subscriptions.filter((subscription) => subscription.status === status);
}

export function getMrrSummary(): MrrSummary {
  const accounts = getAllAccounts();
  let mrrCents = 0;
  let activeCount = 0;
  let trialingCount = 0;
  let pastDueCount = 0;
  let canceledCount = 0;

  for (const account of accounts) {
    mrrCents += account.mrrCents;
    if (account.subscriptionStatus === 'active') activeCount += 1;
    if (account.subscriptionStatus === 'trialing') trialingCount += 1;
    if (account.subscriptionStatus === 'past_due') pastDueCount += 1;
    if (account.subscriptionStatus === 'canceled') canceledCount += 1;
  }

  return { mrrCents, activeCount, trialingCount, pastDueCount, canceledCount };
}
