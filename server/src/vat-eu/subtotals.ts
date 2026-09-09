import {
  type Cents,
  roundHalfUp,
  type VatCategory,
  type VatSubtotal,
} from '@fakturcho/shared-types';

export interface VatSubtotalLineInput {
  lineTotal: Cents;
  vatRateBp: number;
  vatCategory: VatCategory;
}

function groupKey(vatCategory: VatCategory, rateBp: number): string {
  return `${vatCategory}:${rateBp}`;
}

export function computeVatSubtotals(lines: readonly VatSubtotalLineInput[]): VatSubtotal[] {
  const groups = new Map<
    string,
    { vatCategory: VatCategory; rateBp: number; taxableAmount: Cents }
  >();

  for (const line of lines) {
    const key = groupKey(line.vatCategory, line.vatRateBp);
    const group = groups.get(key);
    if (group) {
      group.taxableAmount += line.lineTotal;
    } else {
      groups.set(key, {
        vatCategory: line.vatCategory,
        rateBp: line.vatRateBp,
        taxableAmount: line.lineTotal,
      });
    }
  }

  return Array.from(groups.values()).map((group) => ({
    vatCategory: group.vatCategory,
    rateBp: group.rateBp,
    taxableAmount: group.taxableAmount,
    vatAmount: roundHalfUp((group.taxableAmount * group.rateBp) / 10000, 0),
  }));
}
