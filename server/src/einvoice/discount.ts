import type { Cents, LineItemDto } from '@fakturcho/shared-types';
import { roundHalfUp } from '@fakturcho/shared-types';

export function discountAdjustedLines(
  lineItems: readonly LineItemDto[],
  subtotal: Cents,
  discountTotal: Cents,
): LineItemDto[] {
  if (discountTotal === 0 || subtotal === 0) return [...lineItems];
  return lineItems.map((line) => ({
    ...line,
    lineTotal: line.lineTotal - roundHalfUp((line.lineTotal * discountTotal) / subtotal, 0),
  }));
}
