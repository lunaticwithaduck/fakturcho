import { useMemo } from 'react';
import { getTurnoverReport } from '../data/reports';
import type { TurnoverReportRow } from '../types/admin';

export function useTurnoverReport(month: string): {
  data: TurnoverReportRow[];
  isLoading: boolean;
} {
  const data = useMemo(() => getTurnoverReport(month), [month]);
  return { data, isLoading: false };
}
