import { useListReportMonthsQuery } from '../api';

export function useReportMonths(): { data: string[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useListReportMonthsQuery();
  return { data: data ?? [], isLoading, isError };
}
