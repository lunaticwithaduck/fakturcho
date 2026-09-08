import type { AccountListFilters, AccountSummary } from '@fakturcho/shared-types';
import { useListAccountsQuery } from '../api';

export function useAccounts(filters: AccountListFilters): {
  data: AccountSummary[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useListAccountsQuery(filters);
  return { data: data ?? [], isLoading, isError };
}
