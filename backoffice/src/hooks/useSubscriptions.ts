import type { SubscriptionStatusFilter, SubscriptionSummary } from '@fakturcho/shared-types';
import { useListSubscriptionsQuery } from '../api';

export function useSubscriptions(status: SubscriptionStatusFilter): {
  data: SubscriptionSummary[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useListSubscriptionsQuery(status);
  return { data: data ?? [], isLoading, isError };
}
