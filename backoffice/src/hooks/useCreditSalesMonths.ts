import type { CreditSalesMonth } from '@fakturcho/shared-types';
import { useListCreditSalesMonthsQuery } from '../api';

export function useCreditSalesMonths(): {
  data: CreditSalesMonth[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useListCreditSalesMonthsQuery();
  return { data: data ?? [], isLoading, isError };
}
