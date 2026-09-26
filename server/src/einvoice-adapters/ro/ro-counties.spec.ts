import { describe, expect, it } from 'vitest';
import { toRoSubdivisionCode } from './ro-counties';

describe('toRoSubdivisionCode', () => {
  it('accepts the bare or prefixed ISO code', () => {
    expect(toRoSubdivisionCode('CJ')).toBe('RO-CJ');
    expect(toRoSubdivisionCode('ro-cj')).toBe('RO-CJ');
    expect(toRoSubdivisionCode('B')).toBe('RO-B');
  });

  it('resolves county names with or without diacritics and a Județul prefix', () => {
    expect(toRoSubdivisionCode('Cluj')).toBe('RO-CJ');
    expect(toRoSubdivisionCode('Județul Argeș')).toBe('RO-AG');
    expect(toRoSubdivisionCode('Bistrita - Nasaud')).toBe('RO-BN');
    expect(toRoSubdivisionCode('Satu Mare')).toBe('RO-SM');
    expect(toRoSubdivisionCode('București')).toBe('RO-B');
    expect(toRoSubdivisionCode('Municipiul București')).toBe('RO-B');
  });

  it('returns null for an unknown value', () => {
    expect(toRoSubdivisionCode('Cluj-Napoca')).toBeNull();
    expect(toRoSubdivisionCode('XX')).toBeNull();
  });
});
