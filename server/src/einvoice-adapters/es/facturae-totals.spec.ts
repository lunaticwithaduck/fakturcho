import type { LineItemDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { groupIvaSubtotals, taxesOutputsBlock } from './facturae-totals';

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

describe('groupIvaSubtotals', () => {
  it('rounds the VAT once on the aggregated taxable amount, not per line', () => {
    const subtotals = groupIvaSubtotals([
      line({ id: 'line-1', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
      line({ id: 'line-2', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
    ]);
    expect(subtotals).toEqual([{ vatCategory: 'S', rateBp: 2500, taxableAmount: 2, vatAmount: 1 }]);
  });

  it('keeps distinct categories and rates apart', () => {
    const subtotals = groupIvaSubtotals([
      line({ id: 'line-1', lineTotal: 10000, vatRateBp: 2100, vatCategory: 'S' }),
      line({ id: 'line-2', lineTotal: 5000, vatRateBp: 1000, vatCategory: 'S' }),
    ]);
    expect(subtotals).toEqual([
      { vatCategory: 'S', rateBp: 2100, taxableAmount: 10000, vatAmount: 2100 },
      { vatCategory: 'S', rateBp: 1000, taxableAmount: 5000, vatAmount: 500 },
    ]);
  });
});

describe('taxesOutputsBlock', () => {
  it('emits one Tax entry per aggregated group with the correctly rounded amount', () => {
    const xml = taxesOutputsBlock([
      line({ id: 'line-1', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
      line({ id: 'line-2', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
    ]);
    expect(xml).toContain('<TaxableBase><TotalAmount>0.02</TotalAmount></TaxableBase>');
    expect(xml).toContain('<TaxAmount><TotalAmount>0.01</TotalAmount></TaxAmount>');
  });
});
