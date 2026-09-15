import { describe, expect, it } from 'vitest';
import {
  formatCents,
  formatCentsForLocale,
  formatDate,
  formatDateForLocale,
  formatMoney,
  formatMoneyForLocale,
  parseMoneyInput,
  parseMoneyInputForLocale,
} from './format';

const CENTS_FIXTURES = [0, 5, 999_99, 1_000_00, 1_000_000_00, 12_345_678_00, -160000];

describe('formatCentsForLocale / formatMoneyForLocale — bg parity', () => {
  it('is byte-identical to the existing BG-only formatters for every fixture', () => {
    for (const cents of CENTS_FIXTURES) {
      expect(formatCentsForLocale(cents, 'bg')).toBe(formatCents(cents));
      expect(formatMoneyForLocale(cents, 'bg')).toBe(formatMoney(cents));
    }
  });
});

describe('formatCentsForLocale — en', () => {
  const cases: Array<[number, string]> = [
    [0, '0.00'],
    [5, '0.05'],
    [999_99, '999.99'],
    [1_000_00, '1,000.00'],
    [1_000_000_00, '1,000,000.00'],
    [12_345_678_00, '12,345,678.00'],
    [-160000, '-1,600.00'],
  ];

  it.each(cases)('formats %i cents as %s', (cents, expected) => {
    expect(formatCentsForLocale(cents, 'en')).toBe(expected);
  });
});

describe('formatMoneyForLocale — en', () => {
  it('appends the € suffix to the en-formatted amount', () => {
    expect(formatMoneyForLocale(1_000_00, 'en')).toBe('1,000.00 €');
    expect(formatMoneyForLocale(-160000, 'en')).toBe('-1,600.00 €');
  });
});

describe('parseMoneyInputForLocale — bg parity', () => {
  it('is byte-identical to the existing BG-only parseMoneyInput for every fixture', () => {
    for (const cents of CENTS_FIXTURES) {
      const raw = formatCentsForLocale(cents, 'bg');
      expect(parseMoneyInputForLocale(raw, 'bg')).toBe(parseMoneyInput(raw));
    }
  });

  it('returns null on malformed input, same as parseMoneyInput', () => {
    expect(parseMoneyInputForLocale('', 'bg')).toBeNull();
    expect(parseMoneyInputForLocale('abc', 'bg')).toBeNull();
    expect(parseMoneyInputForLocale('12,345', 'bg')).toBeNull();
  });
});

describe('parseMoneyInputForLocale — en', () => {
  const cases: Array<[string, number | null]> = [
    ['1600', 160000],
    ['1,600.00', 160000],
    ['1600.00', 160000],
    ['10,757.07', 1075707],
    ['0.05', 5],
    ['-1,600.00', -160000],
    ['', null],
    ['abc', null],
    ['12.345', null],
  ];

  it.each(cases)('parses %s as %s', (raw, expected) => {
    expect(parseMoneyInputForLocale(raw, 'en')).toBe(expected);
  });

  it('round-trips every fixture through formatCentsForLocale', () => {
    for (const cents of CENTS_FIXTURES) {
      const raw = formatCentsForLocale(cents, 'en');
      expect(parseMoneyInputForLocale(raw, 'en')).toBe(cents);
    }
  });
});

describe('parseMoneyInputForLocale — table-driven, all published locales', () => {
  const cases: Array<
    [string, 'bg' | 'en' | 'de' | 'fr' | 'it' | 'pl' | 'ro' | 'es', number | null]
  > = [
    ['12,50', 'bg', 1250],
    ['1 600,00', 'bg', 160000],
    ['1600', 'bg', 160000],
    ['1600.00', 'en', 160000],
    ['1,600.00', 'en', 160000],
    ['1600', 'en', 160000],
    ['12,50', 'de', 1250],
    ['12.50', 'de', 1250],
    ['1.234,50', 'de', 123450],
    ['1234,50', 'de', 123450],
    ['1234', 'de', 123400],
    ['1.234', 'de', 123400],
    ['12,50', 'fr', 1250],
    ['1 234,50', 'fr', 123450],
    ['1 234,50', 'fr', 123450],
    ['1 234,50', 'fr', 123450],
    ['1234', 'fr', 123400],
    ['12,50', 'it', 1250],
    ['12.50', 'it', 1250],
    ['1.234,50', 'it', 123450],
    ['1234,50', 'it', 123450],
    ['1234', 'it', 123400],
    ['123.456', 'it', 12345600],
    ['12,50', 'pl', 1250],
    ['1 234,50', 'pl', 123450],
    ['1234,5', 'pl', 123450],
    ['1234', 'pl', 123400],
    ['12,50', 'ro', 1250],
    ['1.234,50', 'ro', 123450],
    ['1234', 'ro', 123400],
    ['12,50', 'es', 1250],
    ['12.50', 'es', 1250],
    ['1.234,50', 'es', 123450],
    ['1234', 'es', 123400],
    ['-12,50', 'de', -1250],
    ['-1.234,50', 'it', -123450],
    ['', 'de', null],
    ['abc', 'it', null],
    ['12,345', 'it', null],
    ['1,234,50', 'it', null],
    ['1.234.567,89', 'de', 123456789],
    ['1234.5678', 'de', null],
  ];

  it.each(cases)('parses %s (%s) as %s', (raw, locale, expected) => {
    expect(parseMoneyInputForLocale(raw, locale)).toBe(expected);
  });
});

describe('formatDateForLocale — bg parity', () => {
  it('is byte-identical to the existing BG-only formatDate', () => {
    expect(formatDateForLocale('2026-08-02', 'bg')).toBe(formatDate('2026-08-02'));
    expect(formatDateForLocale('2026-01-05', 'bg')).toBe(formatDate('2026-01-05'));
  });

  it('returns an empty string for a missing value, same as formatDate', () => {
    expect(formatDateForLocale(null, 'bg')).toBe('');
    expect(formatDateForLocale(undefined, 'bg')).toBe('');
  });
});

describe('formatDateForLocale — en', () => {
  it('renders DD/MM/YYYY via Intl.DateTimeFormat(en-IE)', () => {
    expect(formatDateForLocale('2026-08-02', 'en')).toBe('02/08/2026');
    expect(formatDateForLocale('2026-01-05', 'en')).toBe('05/01/2026');
  });

  it('returns an empty string for a missing value', () => {
    expect(formatDateForLocale(null, 'en')).toBe('');
    expect(formatDateForLocale(undefined, 'en')).toBe('');
  });
});
