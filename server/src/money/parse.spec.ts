import { describe, expect, it } from 'vitest';
import { parseCents, parseDate } from './parse';

describe('parseCents', () => {
  it('parses a Bulgarian-formatted amount back to integer cents', () => {
    expect(parseCents('1 600,00')).toBe(160000);
    expect(parseCents('10 757,07')).toBe(1075707);
  });

  it('parses plain amounts without grouping', () => {
    expect(parseCents('5')).toBe(500);
    expect(parseCents('5,5')).toBe(550);
    expect(parseCents('0,05')).toBe(5);
  });

  it('parses a dot decimal separator too', () => {
    expect(parseCents('1600.00')).toBe(160000);
  });

  it('parses a leading minus sign', () => {
    expect(parseCents('-1 600,00')).toBe(-160000);
  });

  it('rejects malformed input', () => {
    expect(() => parseCents('')).toThrow();
    expect(() => parseCents('abc')).toThrow();
    expect(() => parseCents('1,999')).toThrow();
  });
});

describe('parseDate', () => {
  it('round-trips DD.MM.YYYY to a UTC date', () => {
    const date = parseDate('02.08.2026');
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(7);
    expect(date.getUTCDate()).toBe(2);
  });

  it('rejects malformed input', () => {
    expect(() => parseDate('2026-08-02')).toThrow();
  });
});
