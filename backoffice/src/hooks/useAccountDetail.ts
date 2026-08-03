import { useMemo } from 'react';
import { getAccountById } from '../data/accounts';
import type { AccountDetail } from '../types/admin';

export function useAccountDetail(accountId: string | null): {
  data: AccountDetail | undefined;
  isLoading: boolean;
} {
  const data = useMemo(() => (accountId ? getAccountById(accountId) : undefined), [accountId]);
  return { data, isLoading: false };
}
