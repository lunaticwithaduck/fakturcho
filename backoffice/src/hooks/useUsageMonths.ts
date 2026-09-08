import type { UsageMonthSummary } from '@fakturcho/shared-types';
import { useListUsageMonthsQuery } from '../api';

export function useUsageMonths(): {
  data: UsageMonthSummary[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useListUsageMonthsQuery();
  return { data: data ?? [], isLoading, isError };
}
