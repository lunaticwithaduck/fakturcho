import { describe, expect, it } from 'vitest';
import { formatCentsForLocale } from './format';
import { parseCents, parseMoneyInputForLocale } from './parse';

const CENTS_FIXTURES = [0, 5, 999_99, 1_000_00, 1_000_000_00, 12_345_678_00, -160000];

describe('parseMoneyInputForLocale — bg parity', () => {
  it('is byte-identical to the existing BG-only parseCents for every fixture', () => {
    for (const cents of CENTS_FIXTURES) {
      const raw = formatCentsForLocale(cents, 'bg');
      expect(parseMoneyInputForLocale(raw, 'bg')).toBe(parseCents(raw));
    }
  });

  it('rejects malformed input the same way parseCents does', () => {
    expect(() => parseMoneyInputForLocale('', 'bg')).toThrow();
    expect(() => parseMoneyInputForLocale('abc', 'bg')).toThrow();
    expect(() => parseMoneyInputForLocale('1,999', 'bg')).toThrow();
  });
});

describe('parseMoneyInputForLocale — en', () => {
  const cases: Array<[string, number]> = [
    ['1600', 160000],
    ['1,600.00', 160000],
    ['1600.00', 160000],
    ['10,757.07', 1075707],
    ['0.05', 5],
    ['-1,600.00', -160000],
  ];

  it.each(cases)('parses %s as %i', (raw, expected) => {
    expect(parseMoneyInputForLocale(raw, 'en')).toBe(expected);
  });

  it('rejects malformed input', () => {
    expect(() => parseMoneyInputForLocale('', 'en')).toThrow();
    expect(() => parseMoneyInputForLocale('abc', 'en')).toThrow();
    expect(() => parseMoneyInputForLocale('12.345', 'en')).toThrow();
  });

  it('round-trips every fixture through formatCentsForLocale', () => {
    for (const cents of CENTS_FIXTURES) {
      const raw = formatCentsForLocale(cents, 'en');
      expect(parseMoneyInputForLocale(raw, 'en')).toBe(cents);
    }
  });
});
