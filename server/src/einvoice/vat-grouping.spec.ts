import type { LineItemDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { groupVatSubtotals } from './vat-grouping';

function line(overrides: Partial<LineItemDto>): LineItemDto {
  return {
    id: 'line-1',
    name: 'Item',
    quantity: '1',
    unitPrice: 0,
    lineTotal: 0,
    sortOrder: 0,
    vatRateBp: 0,
    vatCategory: 'S',
    unitCode: null,
    ...overrides,
  };
}

describe('groupVatSubtotals', () => {
  it('rounds the VAT once on the aggregated taxable amount, not per line', () => {
    const subtotals = groupVatSubtotals([
      line({ id: 'line-1', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
      line({ id: 'line-2', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
    ]);
    expect(subtotals).toEqual([{ vatCategory: 'S', rateBp: 2500, taxableAmount: 2, vatAmount: 1 }]);
  });

  it('merges lines sharing category and rate into one subtotal', () => {
    const subtotals = groupVatSubtotals([
      line({ id: 'line-1', lineTotal: 10000, vatRateBp: 2000, vatCategory: 'S' }),
      line({ id: 'line-2', lineTotal: 20000, vatRateBp: 2000, vatCategory: 'S' }),
    ]);
    expect(subtotals).toEqual([
      { vatCategory: 'S', rateBp: 2000, taxableAmount: 30000, vatAmount: 6000 },
    ]);
  });

  it('keeps distinct categories and rates apart', () => {
    const subtotals = groupVatSubtotals([
      line({ id: 'line-1', lineTotal: 10000, vatRateBp: 2000, vatCategory: 'S' }),
      line({ id: 'line-2', lineTotal: 20000, vatRateBp: 0, vatCategory: 'Z' }),
    ]);
    expect(subtotals).toEqual([
      { vatCategory: 'S', rateBp: 2000, taxableAmount: 10000, vatAmount: 2000 },
      { vatCategory: 'Z', rateBp: 0, taxableAmount: 20000, vatAmount: 0 },
    ]);
  });

  it('returns an empty array for no line items', () => {
    expect(groupVatSubtotals([])).toEqual([]);
  });
});
