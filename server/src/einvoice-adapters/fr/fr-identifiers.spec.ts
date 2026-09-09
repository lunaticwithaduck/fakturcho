import { describe, expect, it } from 'vitest';
import {
  isValidFrenchVatNumber,
  isValidSiren,
  isValidSiret,
  resolveFrenchBusinessIdentifier,
} from './fr-identifiers';

describe('isValidSiren', () => {
  it('accepts a 9-digit number with a valid Luhn checksum', () => {
    expect(isValidSiren('394426001')).toBe(true);
  });

  it('rejects a checksum failure', () => {
    expect(isValidSiren('394426002')).toBe(false);
  });

  it('rejects a wrong length', () => {
    expect(isValidSiren('3944260')).toBe(false);
    expect(isValidSiren('39442600100019')).toBe(false);
  });

  it('rejects non-digit characters', () => {
    expect(isValidSiren('39442600A')).toBe(false);
  });
});

describe('isValidSiret', () => {
  it('accepts a 14-digit number whose SIREN prefix and full checksum are both valid', () => {
    expect(isValidSiret('39442600100019')).toBe(true);
  });

  it('rejects a SIRET whose SIREN prefix is invalid', () => {
    expect(isValidSiret('39442600200019')).toBe(false);
  });

  it('rejects a wrong length', () => {
    expect(isValidSiret('394426001')).toBe(false);
  });
});

describe('isValidFrenchVatNumber', () => {
  it('accepts FR followed by 11 characters', () => {
    expect(isValidFrenchVatNumber('FR40394426001')).toBe(true);
  });

  it('rejects a missing FR prefix', () => {
    expect(isValidFrenchVatNumber('DE123456789')).toBe(false);
  });

  it('rejects the wrong length', () => {
    expect(isValidFrenchVatNumber('FR4039442600')).toBe(false);
    expect(isValidFrenchVatNumber('FR403944260011')).toBe(false);
  });
});

describe('resolveFrenchBusinessIdentifier', () => {
  it('resolves a valid SIRET to scheme 0009', () => {
    expect(resolveFrenchBusinessIdentifier('39442600100019')).toEqual({
      scheme: 'SIRET',
      schemeId: '0009',
      value: '39442600100019',
    });
  });

  it('resolves a valid SIREN to scheme 0002', () => {
    expect(resolveFrenchBusinessIdentifier('394426001')).toEqual({
      scheme: 'SIREN',
      schemeId: '0002',
      value: '394426001',
    });
  });

  it('returns null for an invalid value', () => {
    expect(resolveFrenchBusinessIdentifier('not-a-siren')).toBeNull();
  });

  it('returns null for null', () => {
    expect(resolveFrenchBusinessIdentifier(null)).toBeNull();
  });
});
