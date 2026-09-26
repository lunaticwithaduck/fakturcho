import type { LineItemDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { groupFa3VatBuckets, vatRateCode } from './fa3-vat-groups';

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

describe('groupFa3VatBuckets', () => {
  it('rounds the VAT once on the aggregated taxable amount, not per line', () => {
    const buckets = groupFa3VatBuckets([
      line({ id: 'line-1', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
      line({ id: 'line-2', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
    ]);
    expect(buckets).toEqual([
      { netTag: 'P_13_1', vatTag: 'P_14_1', taxableAmount: 2, vatAmount: 1 },
    ]);
  });

  it('buckets the standard 23% rate under P_13_1/P_14_1', () => {
    const buckets = groupFa3VatBuckets([
      line({ id: 'line-1', lineTotal: 100000, vatRateBp: 2300, vatCategory: 'S' }),
    ]);
    expect(buckets).toEqual([
      { netTag: 'P_13_1', vatTag: 'P_14_1', taxableAmount: 100000, vatAmount: 23000 },
    ]);
  });

  it('buckets the reduced 8% rate under P_13_2/P_14_2', () => {
    const buckets = groupFa3VatBuckets([
      line({ id: 'line-1', lineTotal: 100000, vatRateBp: 800, vatCategory: 'S' }),
    ]);
    expect(buckets).toEqual([
      { netTag: 'P_13_2', vatTag: 'P_14_2', taxableAmount: 100000, vatAmount: 8000 },
    ]);
  });

  it('carries zero-rated exports under P_13_6_1 with no VAT tag', () => {
    const buckets = groupFa3VatBuckets([
      line({ id: 'line-1', lineTotal: 50000, vatRateBp: 0, vatCategory: 'Z' }),
    ]);
    expect(buckets).toEqual([
      { netTag: 'P_13_6_1', vatTag: null, taxableAmount: 50000, vatAmount: 0 },
    ]);
  });

  it('buckets EU B2B services (art. 28b, category AE) under P_13_9, not the domestic-reverse-charge P_13_10', () => {
    const buckets = groupFa3VatBuckets([
      line({ id: 'line-1', lineTotal: 200000, vatRateBp: 0, vatCategory: 'AE' }),
    ]);
    expect(buckets).toEqual([
      { netTag: 'P_13_9', vatTag: null, taxableAmount: 200000, vatAmount: 0 },
    ]);
  });

  it('merges lines that share a bucket, without merging distinct buckets', () => {
    const buckets = groupFa3VatBuckets([
      line({ id: 'line-1', lineTotal: 10000, vatRateBp: 2300, vatCategory: 'S' }),
      line({ id: 'line-2', lineTotal: 20000, vatRateBp: 2300, vatCategory: 'S' }),
      line({ id: 'line-3', lineTotal: 5000, vatRateBp: 0, vatCategory: 'E' }),
    ]);
    expect(buckets).toEqual([
      { netTag: 'P_13_1', vatTag: 'P_14_1', taxableAmount: 30000, vatAmount: 6900 },
      { netTag: 'P_13_7', vatTag: null, taxableAmount: 5000, vatAmount: 0 },
    ]);
  });
});

describe('vatRateCode', () => {
  it('renders the standard rate as a whole percentage', () => {
    expect(vatRateCode('S', 2300)).toBe('23');
  });

  it('renders the fixed codes for the non-standard categories', () => {
    expect(vatRateCode('Z', 0)).toBe('0 KR');
    expect(vatRateCode('K', 0)).toBe('0 WDT');
    expect(vatRateCode('G', 0)).toBe('0 EX');
    expect(vatRateCode('E', 0)).toBe('zw');
    expect(vatRateCode('AE', 0)).toBe('np II');
    expect(vatRateCode('O', 0)).toBe('np I');
  });
});
