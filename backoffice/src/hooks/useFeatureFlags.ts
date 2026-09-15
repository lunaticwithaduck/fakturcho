import type { AdminFeatureFlagDto } from '@fakturcho/shared-types';
import { useListFeatureFlagsQuery } from '../api';

export function useFeatureFlags(): {
  data: AdminFeatureFlagDto[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useListFeatureFlagsQuery();
  return { data: data ?? [], isLoading, isError };
}
