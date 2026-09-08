import type { MrrSummary } from '@fakturcho/shared-types';
import { useGetMrrSummaryQuery } from '../api';

const EMPTY_SUMMARY: MrrSummary = {
  mrrCents: 0,
  activeCount: 0,
  trialingCount: 0,
  pastDueCount: 0,
  canceledCount: 0,
};

export function useMrrSummary(): { data: MrrSummary; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useGetMrrSummaryQuery();
  return { data: data ?? EMPTY_SUMMARY, isLoading, isError };
}
