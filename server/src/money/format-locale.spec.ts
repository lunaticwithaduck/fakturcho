import { describe, expect, it } from 'vitest';
import {
  formatCents,
  formatCentsForLocale,
  formatDate,
  formatDateForLocale,
  formatEur,
  formatMoneyForLocale,
} from './format';

const CENTS_FIXTURES = [0, 5, 999_99, 1_000_00, 1_000_000_00, 12_345_678_00, -160000];

describe('formatCentsForLocale / formatMoneyForLocale — bg parity', () => {
  it('is byte-identical to the existing BG-only formatters for every fixture', () => {
    for (const cents of CENTS_FIXTURES) {
      expect(formatCentsForLocale(cents, 'bg')).toBe(formatCents(cents));
      expect(formatMoneyForLocale(cents, 'bg')).toBe(formatEur(cents));
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
  it('prefixes the en-formatted amount with €', () => {
    expect(formatMoneyForLocale(1_000_00, 'en')).toBe('€1,000.00');
    expect(formatMoneyForLocale(-160000, 'en')).toBe('-€1,600.00');
  });
});

describe('formatDateForLocale — bg parity', () => {
  it('is byte-identical to the existing BG-only formatDate', () => {
    expect(formatDateForLocale('2026-08-02', 'bg')).toBe(formatDate('2026-08-02'));
    expect(formatDateForLocale('2026-01-05', 'bg')).toBe(formatDate('2026-01-05'));
  });
});

describe('formatDateForLocale — en', () => {
  it('renders DD/MM/YYYY via Intl.DateTimeFormat(en-IE)', () => {
    expect(formatDateForLocale('2026-08-02', 'en')).toBe('02/08/2026');
    expect(formatDateForLocale('2026-01-05', 'en')).toBe('05/01/2026');
  });
});

describe('formatCentsForLocale — es', () => {
  const cases: Array<[number, string]> = [
    [0, '0,00'],
    [5, '0,05'],
    [999_99, '999,99'],
    [1_000_00, '1.000,00'],
    [1_000_000_00, '1.000.000,00'],
    [12_345_678_00, '12.345.678,00'],
    [-160000, '-1.600,00'],
  ];

  it.each(cases)('formats %i cents as %s', (cents, expected) => {
    expect(formatCentsForLocale(cents, 'es')).toBe(expected);
  });
});

describe('formatMoneyForLocale — es', () => {
  it('appends the € suffix to the es-formatted amount', () => {
    expect(formatMoneyForLocale(1_000_00, 'es')).toBe('1.000,00 €');
    expect(formatMoneyForLocale(-160000, 'es')).toBe('-1.600,00 €');
  });
});

describe('formatDateForLocale — es', () => {
  it('renders DD/MM/YYYY with a slash separator', () => {
    expect(formatDateForLocale('2026-08-02', 'es')).toBe('02/08/2026');
    expect(formatDateForLocale('2026-01-05', 'es')).toBe('05/01/2026');
  });
});
