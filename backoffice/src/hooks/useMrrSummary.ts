import { useMemo } from 'react';
import { getMrrSummary } from '../data/subscriptions';
import type { MrrSummary } from '../types/admin';

export function useMrrSummary(): { data: MrrSummary; isLoading: boolean } {
  const data = useMemo(() => getMrrSummary(), []);
  return { data, isLoading: false };
}
