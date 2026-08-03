import { useMemo } from 'react';
import { listSubscriptions } from '../data/subscriptions';
import type { SubscriptionStatusFilter, SubscriptionSummary } from '../types/admin';

export function useSubscriptions(status: SubscriptionStatusFilter): {
  data: SubscriptionSummary[];
  isLoading: boolean;
} {
  const data = useMemo(() => listSubscriptions(status), [status]);
  return { data, isLoading: false };
}
