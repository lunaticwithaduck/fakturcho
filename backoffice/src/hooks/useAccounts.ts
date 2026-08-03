import { useMemo } from 'react';
import { listAccounts } from '../data/accounts';
import type { AccountListFilters, AccountSummary } from '../types/admin';

export function useAccounts(filters: AccountListFilters): {
  data: AccountSummary[];
  isLoading: boolean;
} {
  const data = useMemo(() => listAccounts(filters), [filters]);
  return { data, isLoading: false };
}
