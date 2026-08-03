import { useMemo } from 'react';
import { getAvailableReportMonths } from '../data/reports';

export function useReportMonths(): { data: string[]; isLoading: boolean } {
  const data = useMemo(() => getAvailableReportMonths(), []);
  return { data, isLoading: false };
}
