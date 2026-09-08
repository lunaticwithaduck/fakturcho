import type { CreditSalesSummary } from '@fakturcho/shared-types';
import { useGetCreditSalesSummaryQuery } from '../api';

const EMPTY_SUMMARY: CreditSalesSummary = {
  soldAllTimeCents: 0,
  soldThisMonthCents: 0,
  purchasesAllTime: 0,
  purchasesThisMonth: 0,
};

export function useCreditSalesSummary(): {
  data: CreditSalesSummary;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useGetCreditSalesSummaryQuery();
  return { data: data ?? EMPTY_SUMMARY, isLoading, isError };
}
