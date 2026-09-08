import type { AccountDetail } from '@fakturcho/shared-types';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetAccountQuery } from '../api';

export function useAccountDetail(accountId: string | null): {
  data: AccountDetail | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useGetAccountQuery(accountId ?? skipToken);
  return { data, isLoading, isError };
}
