import { roundHalfUp } from '@fakturcho/shared-types';
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
