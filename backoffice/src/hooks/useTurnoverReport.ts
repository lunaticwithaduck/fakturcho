import type { TurnoverReportRow } from '@fakturcho/shared-types';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetTurnoverReportQuery } from '../api';

export function useTurnoverReport(month: string): {
  data: TurnoverReportRow[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useGetTurnoverReportQuery(month || skipToken);
  return { data: data ?? [], isLoading, isError };
}
