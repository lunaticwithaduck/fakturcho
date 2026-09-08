import type { GetTrafficQuery, TrafficOverview } from '@fakturcho/shared-types';
import { useGetTrafficOverviewQuery } from '../api';

const EMPTY: TrafficOverview = {
  connected: false,
  visitors: 0,
  uniqueVisitors: 0,
  pageviews: 0,
  sessions: 0,
  bounceRatePct: 0,
  avgDurationSec: 0,
  series: [],
  referrers: [],
  pages: [],
  devices: [],
  dashboardUrl: null,
};

export function useTrafficOverview(query: GetTrafficQuery): {
  data: TrafficOverview;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useGetTrafficOverviewQuery(query);
  return { data: data ?? EMPTY, isLoading, isError };
}
