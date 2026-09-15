import type { LineItemDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { discountAdjustedLines } from './discount';

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

describe('discountAdjustedLines', () => {
  it('returns the lines unchanged when there is no discount', () => {
    const lines = [line({ lineTotal: 1000 }), line({ id: 'line-2', lineTotal: 2000 })];
    expect(discountAdjustedLines(lines, 3000, 0)).toEqual(lines);
  });

  it('allocates the discount proportionally across lines by their share of the subtotal', () => {
    const lines = [
      line({ id: 'line-1', lineTotal: 100000 }),
      line({ id: 'line-2', lineTotal: 200000 }),
    ];
    const adjusted = discountAdjustedLines(lines, 300000, 30000);
    expect(adjusted.map((l) => l.lineTotal)).toEqual([90000, 180000]);
  });

  it('leaves category and rate untouched, only lineTotal changes', () => {
    const lines = [line({ lineTotal: 100000, vatCategory: 'AE', vatRateBp: 0 })];
    const adjusted = discountAdjustedLines(lines, 100000, 10000);
    expect(adjusted[0]).toMatchObject({ vatCategory: 'AE', vatRateBp: 0, lineTotal: 90000 });
  });
});
