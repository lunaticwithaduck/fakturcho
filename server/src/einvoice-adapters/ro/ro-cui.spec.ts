import { describe, expect, it } from 'vitest';
import { extractRomanianCui, isValidRomanianCui, isValidRomanianVatNumber } from './ro-cui';

describe('isValidRomanianCui', () => {
  it('accepts a CUI whose control digit matches the mod-11 checksum', () => {
    expect(isValidRomanianCui('18547290')).toBe(true);
    expect(isValidRomanianCui('14399840')).toBe(true);
  });

  it('rejects a CUI with a wrong control digit', () => {
    expect(isValidRomanianCui('18547291')).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(isValidRomanianCui('RO18547290')).toBe(false);
    expect(isValidRomanianCui('abcdefgh')).toBe(false);
  });

  it('rejects input shorter than 2 or longer than 10 digits', () => {
    expect(isValidRomanianCui('1')).toBe(false);
    expect(isValidRomanianCui('12345678901')).toBe(false);
  });

  it('tolerates surrounding whitespace', () => {
    expect(isValidRomanianCui('  18547290  ')).toBe(true);
  });
});

describe('isValidRomanianVatNumber', () => {
  it('accepts an RO-prefixed VAT number with a valid CUI', () => {
    expect(isValidRomanianVatNumber('RO18547290')).toBe(true);
  });

  it('is case-insensitive on the RO prefix', () => {
    expect(isValidRomanianVatNumber('ro18547290')).toBe(true);
  });

  it('rejects a VAT number without the RO prefix', () => {
    expect(isValidRomanianVatNumber('18547290')).toBe(false);
    expect(isValidRomanianVatNumber('BG123456789')).toBe(false);
  });

  it('rejects an RO-prefixed number with an invalid checksum', () => {
    expect(isValidRomanianVatNumber('RO18547291')).toBe(false);
  });
});

describe('extractRomanianCui', () => {
  it('strips the RO prefix when present', () => {
    expect(extractRomanianCui('RO18547290')).toBe('18547290');
  });

  it('leaves a bare CUI unchanged', () => {
    expect(extractRomanianCui('18547290')).toBe('18547290');
  });
});
