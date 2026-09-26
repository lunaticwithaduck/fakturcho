import { describe, expect, it } from 'vitest';
import {
  correctedGrossAmountCents,
  isMppRequired,
  MPP_ANNEX_15_THRESHOLD_PLN_CENTS,
} from './split-payment';

describe('isMppRequired', () => {
  it('is false when no line carries a załącznik 15 good/service', () => {
    expect(
      isMppRequired({
        hasAnnex15Line: false,
        currency: 'EUR',
        grossAmountCents: 100_000_00,
        exchangeRate: '4.30',
      }),
    ).toBe(false);
  });

  it('is false when the gross total is exactly 15 000 zł (the law requires it to be exceeded)', () => {
    // 3 000.00 EUR * rate 5 = 15 000.00 PLN exactly.
    expect(
      isMppRequired({
        hasAnnex15Line: true,
        currency: 'EUR',
        grossAmountCents: 300_000,
        exchangeRate: '5',
      }),
    ).toBe(false);
  });

  it('is true when the gross total strictly exceeds 15 000 zł', () => {
    expect(
      isMppRequired({
        hasAnnex15Line: true,
        currency: 'EUR',
        grossAmountCents: 300_001,
        exchangeRate: '5',
      }),
    ).toBe(true);
  });

  it('is false when there is no exchange rate to convert a non-PLN currency', () => {
    expect(
      isMppRequired({
        hasAnnex15Line: true,
        currency: 'EUR',
        grossAmountCents: 10_000_000,
        exchangeRate: null,
      }),
    ).toBe(false);
  });

  it('compares the amount directly when the document currency already is PLN', () => {
    expect(
      isMppRequired({
        hasAnnex15Line: true,
        currency: 'PLN',
        grossAmountCents: MPP_ANNEX_15_THRESHOLD_PLN_CENTS + 1,
        exchangeRate: null,
      }),
    ).toBe(true);
  });
});

describe('correctedGrossAmountCents', () => {
  it('returns the amount unchanged for a plain invoice', () => {
    expect(correctedGrossAmountCents(false, false, 123_000, null)).toBe(123_000);
  });

  it('subtracts the delta from the original for a credit note', () => {
    // 17 000 zł original corrected down to 14 000 zł by a 3 000 zł credit note.
    expect(correctedGrossAmountCents(true, true, 3_000_00, 17_000_00)).toBe(14_000_00);
  });

  it('adds the delta to the original for a debit note', () => {
    expect(correctedGrossAmountCents(true, false, 3_000_00, 14_000_00)).toBe(17_000_00);
  });
});
