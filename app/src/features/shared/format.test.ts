import { describe, expect, it } from 'vitest';
import {
  centsToEditableValue,
  formatDate,
  formatMoney,
  formatSignedMoney,
  parseMoneyInput,
} from './format';

describe('formatMoney', () => {
  const cases: Array<[number, string]> = [
    [0, '0,00 €'],
    [1, '0,01 €'],
    [160000, '1 600,00 €'],
    [1075707, '10 757,07 €'],
    [100000000, '1 000 000,00 €'],
    [-160000, '-1 600,00 €'],
  ];

  it.each(cases)('formats %i cents as %s', (cents, expected) => {
    expect(formatMoney(cents)).toBe(expected);
  });
});

describe('formatSignedMoney', () => {
  const cases: Array<[number, string]> = [
    [100, '+1,00 €'],
    [-10, '-0,10 €'],
    [0, '0,00 €'],
    [250000, '+2 500,00 €'],
  ];

  it.each(cases)('formats %i cents as %s', (cents, expected) => {
    expect(formatSignedMoney(cents)).toBe(expected);
  });
});

describe('parseMoneyInput', () => {
  const cases: Array<[string, number | null]> = [
    ['1600', 160000],
    ['1 600,00', 160000],
    ['1600.00', 160000],
    ['1600,5', 160050],
    ['0,01', 1],
    ['-25,50', -2550],
    ['', null],
    ['abc', null],
    ['12,345', null],
  ];

  it.each(cases)('parses %s as %s', (raw, expected) => {
    expect(parseMoneyInput(raw)).toBe(expected);
  });

  it('round-trips through centsToEditableValue', () => {
    expect(parseMoneyInput(centsToEditableValue(160000))).toBe(160000);
  });
});

describe('formatDate', () => {
  it('renders an ISO date as DD.MM.YYYY', () => {
    expect(formatDate('2026-08-02')).toBe('02.08.2026');
  });

  it('returns an empty string for a missing value', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});
