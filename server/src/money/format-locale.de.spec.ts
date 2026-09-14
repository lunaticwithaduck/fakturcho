import { describe, expect, it } from 'vitest';
import { formatCentsForLocale, formatDateForLocale, formatMoneyForLocale } from './format';

describe('formatCentsForLocale — de', () => {
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
    expect(formatCentsForLocale(cents, 'de')).toBe(expected);
  });
});

describe('formatMoneyForLocale — de', () => {
  it('appends the € suffix to the de-formatted amount', () => {
    expect(formatMoneyForLocale(1_000_00, 'de')).toBe('1.000,00 €');
  });
});

describe('formatDateForLocale — de', () => {
  it('renders DD.MM.YYYY', () => {
    expect(formatDateForLocale('2026-08-02', 'de')).toBe('02.08.2026');
    expect(formatDateForLocale('2026-01-05', 'de')).toBe('05.01.2026');
  });
});
