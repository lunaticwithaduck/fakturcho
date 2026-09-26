import { describe, expect, it } from 'vitest';
import {
  computeLineTotal,
  computeLiveTotals,
  normalizeQuantity,
  parsePercentInput,
  percentBpToEditableValue,
  resolveVatTreatment,
} from './liveTotals';

describe('normalizeQuantity', () => {
  const cases: Array<[string, string | null]> = [
    ['2', '2'],
    ['2,5', '2.5'],
    ['0.333', '0.333'],
    ['', null],
    ['abc', null],
    ['-1', null],
    ['0', null],
  ];

  it.each(cases)('normalizes %s to %s', (raw, expected) => {
    expect(normalizeQuantity(raw)).toBe(expected);
  });
});

describe('computeLineTotal', () => {
  it('multiplies quantity by unit price in integer cents', () => {
    expect(computeLineTotal('2', 250000)).toBe(500000);
    expect(computeLineTotal('220', 2500)).toBe(550000);
  });

  it('supports fractional quantities, comma or dot', () => {
    expect(computeLineTotal('2.5', 1000)).toBe(2500);
    expect(computeLineTotal('2,5', 1000)).toBe(2500);
    expect(computeLineTotal('0.333', 100)).toBe(33);
  });

  it('treats an invalid quantity as zero', () => {
    expect(computeLineTotal('', 1000)).toBe(0);
    expect(computeLineTotal('abc', 1000)).toBe(0);
  });
});

describe('computeLiveTotals', () => {
  it('applies a percent discount then 20% VAT on the discounted base', () => {
    const totals = computeLiveTotals({
      lineItems: [{ quantity: '1', unitPrice: 500000 }],
      discounts: [{ percentBp: 1000, amount: null }],
      vatCharged: true,
      vatRateBp: 2000,
    });
    expect(totals.subtotal).toBe(500000);
    expect(totals.discountTotal).toBe(50000);
    expect(totals.vatAmount).toBe(90000);
    expect(totals.amount).toBe(540000);
  });

  it('applies a flat discount with no VAT', () => {
    const totals = computeLiveTotals({
      lineItems: [{ quantity: '1', unitPrice: 100000 }],
      discounts: [{ percentBp: null, amount: 10000 }],
      vatCharged: false,
      vatRateBp: 2000,
    });
    expect(totals.subtotal).toBe(100000);
    expect(totals.discountTotal).toBe(10000);
    expect(totals.vatAmount).toBe(0);
    expect(totals.amount).toBe(90000);
  });

  it('matches the spec §5 example: 4583.33 base, 916.67 VAT', () => {
    const totals = computeLiveTotals({
      lineItems: [{ quantity: '1', unitPrice: 458333 }],
      discounts: [],
      vatCharged: true,
      vatRateBp: 2000,
    });
    expect(totals.subtotal).toBe(458333);
    expect(totals.vatAmount).toBe(91667);
    expect(totals.amount).toBe(550000);
  });

  it('groups mixed per-line VAT rates instead of applying a single blended rate', () => {
    const totals = computeLiveTotals({
      lineItems: [
        { quantity: '1', unitPrice: 100000, vatRateBp: 2000 },
        { quantity: '1', unitPrice: 100000, vatRateBp: 900 },
      ],
      discounts: [],
      vatCharged: true,
      vatRateBp: 2000,
    });
    expect(totals.subtotal).toBe(200000);
    expect(totals.vatAmount).toBe(20000 + 9000);
    expect(totals.amount).toBe(200000 + 29000);
  });

  it('a line with no explicit vatRateBp falls back to the document rate', () => {
    const totals = computeLiveTotals({
      lineItems: [
        { quantity: '1', unitPrice: 100000 },
        { quantity: '1', unitPrice: 100000, vatRateBp: 900 },
      ],
      discounts: [],
      vatCharged: true,
      vatRateBp: 2000,
    });
    expect(totals.vatAmount).toBe(20000 + 9000);
  });

  it('a discount that does not split evenly still sums exactly across mixed-rate lines', () => {
    const totals = computeLiveTotals({
      lineItems: [
        { quantity: '1', unitPrice: 333, vatRateBp: 2000 },
        { quantity: '1', unitPrice: 333, vatRateBp: 900 },
        { quantity: '1', unitPrice: 334, vatRateBp: 0 },
      ],
      discounts: [{ percentBp: 100, amount: null }],
      vatCharged: true,
      vatRateBp: 2000,
    });
    expect(totals.subtotal).toBe(1000);
    expect(totals.discountTotal).toBe(10);
    expect(totals.amount).toBe(totals.subtotal - totals.discountTotal + totals.vatAmount);
  });

  it('per-line rates with no document VAT charged still zero out', () => {
    const totals = computeLiveTotals({
      lineItems: [{ quantity: '1', unitPrice: 100000, vatRateBp: 2000 }],
      discounts: [],
      vatCharged: false,
      vatRateBp: 2000,
    });
    expect(totals.vatAmount).toBe(0);
  });

  it('sums multiple line items and discounts', () => {
    const totals = computeLiveTotals({
      lineItems: [
        { quantity: '2', unitPrice: 5000 },
        { quantity: '1.5', unitPrice: 2000 },
      ],
      discounts: [
        { percentBp: 500, amount: null },
        { percentBp: null, amount: 100 },
      ],
      vatCharged: false,
      vatRateBp: 0,
    });
    expect(totals.subtotal).toBe(13000);
    expect(totals.discountTotal).toBe(750);
    expect(totals.amount).toBe(12250);
  });
});

describe('resolveVatTreatment', () => {
  it('never offers a ground selector for a non-tax document (isTaxDocument stays false)', () => {
    for (const documentType of ['quote', 'proforma'] as const) {
      expect(
        resolveVatTreatment({
          documentType,
          vatRegistered: false,
          chargeVat: true,
          vatRateBp: 2000,
          groundRequired: true,
        }),
      ).toEqual({ isTaxDocument: false, vatCharged: false, vatRateBp: 0, groundSelectable: false });
    }
  });

  // Mirrors server/src/documents/vat-treatment.ts: a proforma/quote from a
  // VAT-registered issuer computes VAT like an invoice, with no ground to pick.
  it('charges VAT on a proforma or quote for a VAT-registered issuer, regardless of chargeVat', () => {
    for (const documentType of ['quote', 'proforma'] as const) {
      expect(
        resolveVatTreatment({
          documentType,
          vatRegistered: true,
          chargeVat: false,
          vatRateBp: 2000,
          groundRequired: true,
        }),
      ).toEqual({
        isTaxDocument: false,
        vatCharged: true,
        vatRateBp: 2000,
        groundSelectable: false,
      });
    }
  });

  it('never charges VAT on a proforma or quote for a non-registered issuer', () => {
    for (const documentType of ['quote', 'proforma'] as const) {
      expect(
        resolveVatTreatment({
          documentType,
          vatRegistered: false,
          chargeVat: true,
          vatRateBp: 2000,
          groundRequired: true,
        }),
      ).toEqual({ isTaxDocument: false, vatCharged: false, vatRateBp: 0, groundSelectable: false });
    }
  });

  it('does not offer a ground select for a non-registered issuer with a country default', () => {
    expect(
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: false,
        chargeVat: false,
        vatRateBp: 2000,
        groundRequired: false,
      }),
    ).toEqual({ isTaxDocument: true, vatCharged: false, vatRateBp: 0, groundSelectable: false });
  });

  it('offers a ground select for a non-registered issuer with no country default (ES)', () => {
    expect(
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: false,
        chargeVat: false,
        vatRateBp: 2000,
        groundRequired: true,
      }),
    ).toEqual({ isTaxDocument: true, vatCharged: false, vatRateBp: 0, groundSelectable: true });
  });

  it('charges the standard 20% for a registered issuer that charges VAT', () => {
    expect(
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: true,
        chargeVat: true,
        vatRateBp: 2000,
        groundRequired: true,
      }),
    ).toEqual({ isTaxDocument: true, vatCharged: true, vatRateBp: 2000, groundSelectable: false });
  });

  it('offers a ground select only for a registered issuer at 0%', () => {
    expect(
      resolveVatTreatment({
        documentType: 'credit_note',
        vatRegistered: true,
        chargeVat: false,
        vatRateBp: 2000,
        groundRequired: true,
      }),
    ).toEqual({ isTaxDocument: true, vatCharged: false, vatRateBp: 0, groundSelectable: true });
  });
});

describe('parsePercentInput / percentBpToEditableValue', () => {
  const cases: Array<[string, number | null]> = [
    ['10', 1000],
    ['2,5', 250],
    ['0', 0],
    ['', null],
    ['abc', null],
  ];

  it.each(cases)('parses %s as %s basis points', (raw, expected) => {
    expect(parsePercentInput(raw)).toBe(expected);
  });

  it('round-trips through percentBpToEditableValue', () => {
    expect(percentBpToEditableValue(1000)).toBe('10');
    expect(percentBpToEditableValue(250)).toBe('2,5');
    expect(percentBpToEditableValue(null)).toBe('');
  });
});
