import type { CreditPurchaseRow } from '@fakturcho/shared-types';
import { useListCreditPurchasesQuery } from '../api';

export function useCreditPurchases(): {
  data: CreditPurchaseRow[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useListCreditPurchasesQuery();
  return { data: data ?? [], isLoading, isError };
}
