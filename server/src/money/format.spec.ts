import { describe, expect, it } from 'vitest';
import { formatBgn, formatCents, formatDate, formatEur } from './format';

describe('formatCents', () => {
  it('renders Bulgarian display form: comma decimal, space thousands', () => {
    expect(formatCents(160000)).toBe('1 600,00');
    expect(formatCents(1075707)).toBe('10 757,07');
  });

  it('handles amounts under one thousand without a grouping space', () => {
    expect(formatCents(0)).toBe('0,00');
    expect(formatCents(5)).toBe('0,05');
    expect(formatCents(999_99)).toBe('999,99');
  });

  it('groups every three digits from the decimal point', () => {
    expect(formatCents(1_000_00)).toBe('1 000,00');
    expect(formatCents(1_000_000_00)).toBe('1 000 000,00');
    expect(formatCents(12_345_678_00)).toBe('12 345 678,00');
  });

  it('renders negative amounts with a leading minus', () => {
    expect(formatCents(-160000)).toBe('-1 600,00');
  });
});

describe('formatEur / formatBgn', () => {
  it('appends the currency suffix', () => {
    expect(formatEur(550000)).toBe('5 500,00 €');
    expect(formatBgn(1075707)).toBe('10 757,07 лв.');
  });
});

describe('formatDate', () => {
  it('renders DD.MM.YYYY from a Date at UTC midnight', () => {
    expect(formatDate(new Date(Date.UTC(2026, 7, 2)))).toBe('02.08.2026');
  });

  it('renders DD.MM.YYYY from an ISO date string', () => {
    expect(formatDate('2026-08-02')).toBe('02.08.2026');
  });

  it('pads single-digit day and month', () => {
    expect(formatDate('2026-01-05')).toBe('05.01.2026');
  });
});
