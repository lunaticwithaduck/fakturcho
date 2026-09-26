import { describe, expect, it } from 'vitest';
import { amountInWords } from './amount-in-words';

describe('amountInWords — whole EUR values', () => {
  const table: Array<[number, string]> = [
    [0, 'НУЛА'],
    [1, 'ЕДНО'],
    [2, 'ДВЕ'],
    [5, 'ПЕТ'],
    [11, 'ЕДИНАДЕСЕТ'],
    [12, 'ДВАНАДЕСЕТ'],
    [19, 'ДЕВЕТНАДЕСЕТ'],
    [21, 'ДВАДЕСЕТ И ЕДНО'],
    [100, 'СТО'],
    [101, 'СТО И ЕДНО'],
    [1000, 'ХИЛЯДА'],
    [1001, 'ХИЛЯДА И ЕДНО'],
    [2000, 'ДВЕ ХИЛЯДИ'],
    [5500, 'ПЕТ ХИЛЯДИ И ПЕТСТОТИН'],
    [1_000_000, 'ЕДИН МИЛИОН'],
  ];

  it.each(table)('%p EUR -> "%s ЕВРО И 00 ЕВРОЦЕНТА"', (eur, words) => {
    expect(amountInWords(eur * 100)).toBe(`${words} ЕВРО И 00 ЕВРОЦЕНТА`);
  });

  it('matches the spec example verbatim: 550000 cents', () => {
    expect(amountInWords(550000)).toBe('ПЕТ ХИЛЯДИ И ПЕТСТОТИН ЕВРО И 00 ЕВРОЦЕНТА');
  });
});

describe('amountInWords — feminine and neuter agreement', () => {
  it('uses feminine ХИЛЯДА/ХИЛЯДИ, never ДВА with хиляди', () => {
    expect(amountInWords(1000 * 100)).toContain('ХИЛЯДА');
    expect(amountInWords(2000 * 100)).toBe('ДВЕ ХИЛЯДИ ЕВРО И 00 ЕВРОЦЕНТА');
    expect(amountInWords(2000 * 100)).not.toContain('ДВА');
    expect(amountInWords(5000 * 100)).toContain('ПЕТ ХИЛЯДИ');
  });

  it('uses neuter unit forms agreeing with EUR (ЕДНО, ДВЕ, never ЕДИН/ЕДНА/ДВА)', () => {
    expect(amountInWords(1 * 100)).toContain('ЕДНО');
    expect(amountInWords(21 * 100)).toContain('ЕДНО');
    expect(amountInWords(1001 * 100)).toContain('ЕДНО');
    expect(amountInWords(2 * 100)).toContain('ДВЕ');
  });

  it('uses masculine МИЛИОН/МИЛИОНА, never a feminine or neuter one-form', () => {
    expect(amountInWords(1_000_000 * 100)).toBe('ЕДИН МИЛИОН ЕВРО И 00 ЕВРОЦЕНТА');
    expect(amountInWords(2_000_000 * 100)).toBe('ДВА МИЛИОНА ЕВРО И 00 ЕВРОЦЕНТА');
  });
});

describe('amountInWords — cents 0 through 99', () => {
  for (let cents = 0; cents <= 99; cents++) {
    it(`renders ${String(cents).padStart(2, '0')} ЕВРОЦЕНТА`, () => {
      const value = 1234 * 100 + cents;
      expect(amountInWords(value)).toBe(
        `ХИЛЯДА ДВЕСТА ТРИДЕСЕТ И ЧЕТИРИ ЕВРО И ${String(cents).padStart(2, '0')} ЕВРОЦЕНТА`,
      );
    });
  }
});

describe('amountInWords — И placement', () => {
  it('places И only before the last nonzero group/word', () => {
    expect(amountInWords(123 * 100)).toBe('СТО ДВАДЕСЕТ И ТРИ ЕВРО И 00 ЕВРОЦЕНТА');
    expect(amountInWords(120 * 100)).toBe('СТО И ДВАДЕСЕТ ЕВРО И 00 ЕВРОЦЕНТА');
    expect(amountInWords(100 * 100)).toBe('СТО ЕВРО И 00 ЕВРОЦЕНТА');
    expect(amountInWords(20 * 100)).toBe('ДВАДЕСЕТ ЕВРО И 00 ЕВРОЦЕНТА');
  });
});
