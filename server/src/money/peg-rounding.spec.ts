import { EUR_BGN_PEG, eurCentsToBgnCents, roundHalfUp } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('roundHalfUp', () => {
  const cases: Array<[number, number, number]> = [
    [1, 2, 1],
    [1.005, 2, 1],
    [1.015, 2, 1.01],
    [1.025, 2, 1.02],
    [2.675, 2, 2.68],
    [0.005, 2, 0.01],
    [0, 2, 0],
    [-1.005, 2, -1],
    [100, 0, 100],
    [100.5, 0, 101],
  ];

  it.each(cases)('roundHalfUp(%p, %p) === %p', (value, decimals, expected) => {
    expect(roundHalfUp(value, decimals)).toBeCloseTo(expected, 9);
  });
});

describe('eurCentsToBgnCents (peg = 1.95583)', () => {
  it('applies the fixed peg with half-up rounding', () => {
    const table: Array<[number, number]> = [
      [0, 0],
      [100, 196],
      [1_000_00, 195_583],
      [5_500_00, 1_075_707],
      [1, 2],
      [50, 98],
    ];
    for (const [eurCents, expectedBgnCents] of table) {
      expect(eurCentsToBgnCents(eurCents)).toBe(expectedBgnCents);
    }
  });

  it('matches manual half-up rounding for half-cent boundary cases', () => {
    for (let eurCents = 1; eurCents <= 500; eurCents++) {
      const expected = Math.floor(eurCents * EUR_BGN_PEG + 0.5);
      expect(eurCentsToBgnCents(eurCents)).toBe(expected);
    }
  });
});
