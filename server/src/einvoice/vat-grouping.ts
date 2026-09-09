import type { LineItemDto, VatSubtotal } from '@fakturcho/shared-types';

export function groupVatSubtotals(lineItems: readonly LineItemDto[]): VatSubtotal[] {
  const groups = new Map<string, VatSubtotal>();
  for (const line of lineItems) {
    const key = `${line.vatCategory}:${line.vatRateBp}`;
    const vatAmount = Math.round((line.lineTotal * line.vatRateBp) / 10000);
    const existing = groups.get(key);
    if (existing) {
      existing.taxableAmount += line.lineTotal;
      existing.vatAmount += vatAmount;
      continue;
    }
    groups.set(key, {
      vatCategory: line.vatCategory,
      rateBp: line.vatRateBp,
      taxableAmount: line.lineTotal,
      vatAmount,
    });
  }
  return [...groups.values()];
}
