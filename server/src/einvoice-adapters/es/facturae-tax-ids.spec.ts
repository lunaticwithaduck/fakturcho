import { describe, expect, it } from 'vitest';
import { validateSpanishTaxId } from './facturae-tax-ids';

describe('validateSpanishTaxId — NIF (individual)', () => {
  it('accepts a valid NIF check letter', () => {
    expect(validateSpanishTaxId('12345678Z')).toEqual({
      valid: true,
      kind: 'NIF',
      normalized: '12345678Z',
    });
  });

  it('rejects a NIF with the wrong check letter', () => {
    const result = validateSpanishTaxId('12345678A');
    expect(result.valid).toBe(false);
    expect(result.kind).toBe('NIF');
  });

  it('normalizes lowercase and surrounding whitespace', () => {
    expect(validateSpanishTaxId(' 12345678z ').valid).toBe(true);
  });
});

describe('validateSpanishTaxId — NIE (foreign resident)', () => {
  it('accepts a valid NIE check letter', () => {
    expect(validateSpanishTaxId('X1234567L')).toEqual({
      valid: true,
      kind: 'NIE',
      normalized: 'X1234567L',
    });
  });

  it('rejects a NIE with the wrong check letter', () => {
    const result = validateSpanishTaxId('X1234567A');
    expect(result.valid).toBe(false);
    expect(result.kind).toBe('NIE');
  });
});

describe('validateSpanishTaxId — CIF (legal entity)', () => {
  it('accepts a valid numeric-control CIF for a S.L. (letter B)', () => {
    expect(validateSpanishTaxId('B12345674')).toEqual({
      valid: true,
      kind: 'CIF',
      normalized: 'B12345674',
    });
  });

  it('rejects a CIF with the wrong control digit', () => {
    const result = validateSpanishTaxId('B12345678');
    expect(result.valid).toBe(false);
    expect(result.kind).toBe('CIF');
  });

  it('accepts an ES-prefixed EU VAT number by stripping the country prefix', () => {
    expect(validateSpanishTaxId('ESB12345674').valid).toBe(true);
  });

  it('accepts a letter-control CIF for an association (letter N)', () => {
    const result = validateSpanishTaxId('N0000000J');
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('CIF');
  });
});

describe('validateSpanishTaxId — malformed input', () => {
  it('rejects an empty string', () => {
    expect(validateSpanishTaxId('').valid).toBe(false);
    expect(validateSpanishTaxId(null).valid).toBe(false);
    expect(validateSpanishTaxId(undefined).valid).toBe(false);
  });

  it('rejects a string that matches none of the three shapes', () => {
    const result = validateSpanishTaxId('not-a-tax-id');
    expect(result.valid).toBe(false);
    expect(result.kind).toBeNull();
  });
});
