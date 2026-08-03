import { describe, expect, it } from 'vitest';
import { computeDocumentTotals, computeLineTotal } from './totals';

describe('computeLineTotal', () => {
  it('multiplies quantity by unit price in integer cents', () => {
    expect(computeLineTotal('2', 250000)).toBe(500000);
    expect(computeLineTotal('220', 2500)).toBe(550000);
  });

  it('supports up to three fractional digits of quantity', () => {
    expect(computeLineTotal('2.5', 1000)).toBe(2500);
    expect(computeLineTotal('0.333', 100)).toBe(33);
  });
});

describe('computeDocumentTotals — VAT excluded prices (default)', () => {
  it('applies a percent discount then 20% VAT on the discounted base', () => {
    const totals = computeDocumentTotals({
      lineItems: [{ quantity: '1', unitPrice: 500000 }],
      discounts: [{ percentBp: 1000 }],
      vatCharged: true,
      vatRateBp: 2000,
      vatIncluded: false,
    });
    expect(totals.subtotal).toBe(500000);
    expect(totals.discountTotal).toBe(50000);
    expect(totals.vatAmount).toBe(90000);
    expect(totals.amount).toBe(540000);
  });

  it('applies a flat discount', () => {
    const totals = computeDocumentTotals({
      lineItems: [{ quantity: '1', unitPrice: 100000 }],
      discounts: [{ amount: 10000 }],
      vatCharged: false,
      vatRateBp: 2000,
      vatIncluded: false,
    });
    expect(totals.subtotal).toBe(100000);
    expect(totals.discountTotal).toBe(10000);
    expect(totals.vatAmount).toBe(0);
    expect(totals.amount).toBe(90000);
  });

  it('matches the spec §5 example: 4583.33 base, 916.67 VAT', () => {
    const totals = computeDocumentTotals({
      lineItems: [{ quantity: '1', unitPrice: 458333 }],
      discounts: [],
      vatCharged: true,
      vatRateBp: 2000,
      vatIncluded: false,
    });
    expect(totals.subtotal).toBe(458333);
    expect(totals.vatAmount).toBe(91667);
    expect(totals.amount).toBe(550000);
  });
});

describe('computeDocumentTotals — VAT included prices', () => {
  it('backs the net base out of a gross line total', () => {
    const totals = computeDocumentTotals({
      lineItems: [{ quantity: '1', unitPrice: 120000 }],
      discounts: [],
      vatCharged: true,
      vatRateBp: 2000,
      vatIncluded: true,
    });
    expect(totals.subtotal).toBe(100000);
    expect(totals.vatAmount).toBe(20000);
    expect(totals.amount).toBe(120000);
  });

  it('is a no-op when VAT is not charged, regardless of vatIncluded', () => {
    const totals = computeDocumentTotals({
      lineItems: [{ quantity: '1', unitPrice: 120000 }],
      discounts: [],
      vatCharged: false,
      vatRateBp: 2000,
      vatIncluded: true,
    });
    expect(totals.subtotal).toBe(120000);
    expect(totals.vatAmount).toBe(0);
    expect(totals.amount).toBe(120000);
  });
});
