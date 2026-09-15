import { describe, expect, it } from 'vitest';
import { isValidNip, isValidNipChecksum, isValidNipFormat, normalizeNip } from './nip';

describe('normalizeNip', () => {
  it('strips the PL prefix, spaces and dashes', () => {
    expect(normalizeNip('PL123-456-32-18')).toBe('1234563218');
    expect(normalizeNip('123 456 32 18')).toBe('1234563218');
    expect(normalizeNip('pl1234563218')).toBe('1234563218');
  });
});

describe('isValidNipFormat', () => {
  it('accepts exactly 10 digits after normalization', () => {
    expect(isValidNipFormat('PL1234563218')).toBe(true);
    expect(isValidNipFormat('1234563218')).toBe(true);
  });

  it('rejects the wrong digit count', () => {
    expect(isValidNipFormat('123456321')).toBe(false);
    expect(isValidNipFormat('12345632189')).toBe(false);
  });

  it('rejects non-numeric content', () => {
    expect(isValidNipFormat('12345B3218')).toBe(false);
  });
});

describe('isValidNipChecksum', () => {
  it('accepts a NIP whose weighted checksum matches the last digit', () => {
    expect(isValidNipChecksum('1234563218')).toBe(true);
    expect(isValidNipChecksum('PL5260001246')).toBe(true);
  });

  it('rejects a NIP whose last digit does not match the computed checksum', () => {
    expect(isValidNipChecksum('1234563219')).toBe(false);
  });

  it('rejects a malformed NIP outright', () => {
    expect(isValidNipChecksum('123456321')).toBe(false);
  });
});

describe('isValidNip', () => {
  it('requires both a valid format and a valid checksum', () => {
    expect(isValidNip('PL1234563218')).toBe(true);
    expect(isValidNip('PL5260001246')).toBe(true);
    expect(isValidNip('PL1234563219')).toBe(false);
    expect(isValidNip('not-a-nip')).toBe(false);
  });
});
