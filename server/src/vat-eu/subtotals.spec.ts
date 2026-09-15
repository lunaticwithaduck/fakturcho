import { describe, expect, it } from 'vitest';
import { computeVatSubtotals } from './subtotals';

describe('computeVatSubtotals', () => {
  it('returns one subtotal per line when categories and rates differ', () => {
    const subtotals = computeVatSubtotals([
      { lineTotal: 10000, vatRateBp: 2000, vatCategory: 'S' },
      { lineTotal: 5000, vatRateBp: 0, vatCategory: 'Z' },
    ]);
    expect(subtotals).toEqual([
      { vatCategory: 'S', rateBp: 2000, taxableAmount: 10000, vatAmount: 2000 },
      { vatCategory: 'Z', rateBp: 0, taxableAmount: 5000, vatAmount: 0 },
    ]);
  });

  it('merges lines that share the same category and rate', () => {
    const subtotals = computeVatSubtotals([
      { lineTotal: 10000, vatRateBp: 2000, vatCategory: 'S' },
      { lineTotal: 20000, vatRateBp: 2000, vatCategory: 'S' },
    ]);
    expect(subtotals).toEqual([
      { vatCategory: 'S', rateBp: 2000, taxableAmount: 30000, vatAmount: 6000 },
    ]);
  });

  it('keeps the same rate separate across categories', () => {
    const subtotals = computeVatSubtotals([
      { lineTotal: 10000, vatRateBp: 2000, vatCategory: 'S' },
      { lineTotal: 10000, vatRateBp: 2000, vatCategory: 'AE' },
    ]);
    expect(subtotals).toEqual([
      { vatCategory: 'S', rateBp: 2000, taxableAmount: 10000, vatAmount: 2000 },
      { vatCategory: 'AE', rateBp: 2000, taxableAmount: 10000, vatAmount: 2000 },
    ]);
  });

  it('rounds the aggregated group half up', () => {
    const subtotals = computeVatSubtotals([
      { lineTotal: 100, vatRateBp: 500, vatCategory: 'S' },
      { lineTotal: 50, vatRateBp: 500, vatCategory: 'S' },
    ]);
    expect(subtotals).toEqual([
      { vatCategory: 'S', rateBp: 500, taxableAmount: 150, vatAmount: 8 },
    ]);
  });

  it('returns an empty array for no lines', () => {
    expect(computeVatSubtotals([])).toEqual([]);
  });
});
