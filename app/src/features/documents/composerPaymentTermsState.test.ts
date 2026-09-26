import { describe, expect, it } from 'vitest';
import { addDaysToIsoDate, paymentTermsDayOptionsUpTo } from './composerPaymentTermsState';

describe('paymentTermsDayOptionsUpTo', () => {
  it('offers every option when there is no cap', () => {
    expect(paymentTermsDayOptionsUpTo()).toEqual([0, 7, 14, 15, 30, 45, 60]);
  });

  it('excludes options above the cap (e.g. FR C. com. L441-10 I: 60 days)', () => {
    expect(paymentTermsDayOptionsUpTo(30)).toEqual([0, 7, 14, 15, 30]);
  });
});

describe('addDaysToIsoDate', () => {
  it('adds days within the same month', () => {
    expect(addDaysToIsoDate('2026-09-01', 14)).toBe('2026-09-15');
  });

  it('rolls over into the next month', () => {
    expect(addDaysToIsoDate('2026-09-20', 14)).toBe('2026-10-04');
  });

  it('rolls over into the next year', () => {
    expect(addDaysToIsoDate('2026-12-20', 30)).toBe('2027-01-19');
  });

  it('returns the same date for 0 days (due on receipt)', () => {
    expect(addDaysToIsoDate('2026-09-26', 0)).toBe('2026-09-26');
  });

  it('crosses a leap-year February', () => {
    expect(addDaysToIsoDate('2028-02-20', 15)).toBe('2028-03-06');
  });
});
