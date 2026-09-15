import type { LineItemDto, VatCategory } from '@fakturcho/shared-types';
import { computeVatSubtotals } from '../../vat-eu/subtotals';

export interface Fa3VatBucket {
  netTag: string;
  vatTag: string | null;
  taxableAmount: number;
  vatAmount: number;
}

function bucketTags(
  category: VatCategory,
  rateBp: number,
): { netTag: string; vatTag: string | null } {
  if (category === 'S') {
    const pct = Math.round(rateBp / 100);
    switch (pct) {
      case 8:
        return { netTag: 'P_13_2', vatTag: 'P_14_2' };
      case 5:
        return { netTag: 'P_13_3', vatTag: 'P_14_3' };
      case 4:
        return { netTag: 'P_13_4', vatTag: 'P_14_4' };
      default:
        return { netTag: 'P_13_1', vatTag: 'P_14_1' };
    }
  }
  switch (category) {
    case 'Z':
      return { netTag: 'P_13_6_1', vatTag: null };
    case 'K':
      return { netTag: 'P_13_6_2', vatTag: null };
    case 'G':
      return { netTag: 'P_13_6_3', vatTag: null };
    case 'E':
      return { netTag: 'P_13_7', vatTag: null };
    case 'AE':
      return { netTag: 'P_13_10', vatTag: null };
    case 'O':
      return { netTag: 'P_13_8', vatTag: null };
  }
}

export function groupFa3VatBuckets(lineItems: readonly LineItemDto[]): Fa3VatBucket[] {
  const buckets = new Map<string, Fa3VatBucket>();
  for (const subtotal of computeVatSubtotals(lineItems)) {
    const { netTag, vatTag } = bucketTags(subtotal.vatCategory, subtotal.rateBp);
    const vatAmount = vatTag ? subtotal.vatAmount : 0;
    const existing = buckets.get(netTag);
    if (existing) {
      existing.taxableAmount += subtotal.taxableAmount;
      existing.vatAmount += vatAmount;
      continue;
    }
    buckets.set(netTag, { netTag, vatTag, taxableAmount: subtotal.taxableAmount, vatAmount });
  }
  return [...buckets.values()];
}

export function vatRateCode(category: VatCategory, rateBp: number): string {
  switch (category) {
    case 'S':
      return String(Math.round(rateBp / 100));
    case 'Z':
      return '0 KR';
    case 'K':
      return '0 WDT';
    case 'G':
      return '0 EX';
    case 'E':
      return 'zw';
    case 'AE':
      return 'oo';
    case 'O':
      return 'np I';
  }
}
