import { useMemo } from 'react';
import { listUsageMonths } from '../data/usage';
import type { UsageMonthSummary } from '../types/admin';

export function useUsageMonths(): { data: UsageMonthSummary[]; isLoading: boolean } {
  const data = useMemo(() => listUsageMonths(), []);
  return { data, isLoading: false };
}
