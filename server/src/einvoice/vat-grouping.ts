import type { LineItemDto, VatSubtotal } from '@fakturcho/shared-types';
import { computeVatSubtotals } from '../vat-eu/subtotals';

export function groupVatSubtotals(lineItems: readonly LineItemDto[]): VatSubtotal[] {
  return computeVatSubtotals(lineItems);
}
