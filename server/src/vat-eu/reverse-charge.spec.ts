import { describe, expect, it } from 'vitest';
import { hasValidVatNumberFormat, resolveLineVatCategory } from './reverse-charge';

describe('resolveLineVatCategory', () => {
  it('returns AE when the supply crosses two EU VAT-area countries', () => {
    expect(resolveLineVatCategory('BG', 'DE')).toBe('AE');
  });

  it('ignores the requested category once reverse charge applies', () => {
    expect(resolveLineVatCategory('BG', 'DE', 'S')).toBe('AE');
  });

  it('falls back to the requested category for a domestic supply', () => {
    expect(resolveLineVatCategory('BG', 'BG', 'Z')).toBe('Z');
  });

  it('defaults to S for a domestic supply with no requested category', () => {
    expect(resolveLineVatCategory('BG', 'BG')).toBe('S');
  });

  it('defaults to S when there is no client country', () => {
    expect(resolveLineVatCategory('BG', null)).toBe('S');
  });

  it('does not apply reverse charge outside the EU VAT area', () => {
    expect(resolveLineVatCategory('BG', 'US', 'G')).toBe('G');
  });

  it('does not apply reverse charge when the client has no valid VAT number', () => {
    expect(resolveLineVatCategory('BG', 'DE', undefined, false)).toBe('S');
  });

  it('honors the requested category when reverse charge is denied for lack of a VAT number', () => {
    expect(resolveLineVatCategory('BG', 'DE', 'Z', false)).toBe('Z');
  });

  it('still applies reverse charge when the client has a valid VAT number', () => {
    expect(resolveLineVatCategory('BG', 'DE', undefined, true)).toBe('AE');
  });

  it('does not need a VAT number to skip reverse charge domestically', () => {
    expect(resolveLineVatCategory('BG', 'BG', undefined, false)).toBe('S');
  });

  it('does not apply reverse charge when the issuer is not VAT-registered', () => {
    expect(resolveLineVatCategory('BG', 'DE', undefined, true, false)).toBe('S');
  });

  it('honors the requested category when reverse charge is denied for an unregistered issuer', () => {
    expect(resolveLineVatCategory('BG', 'DE', 'Z', true, false)).toBe('Z');
  });

  it('still applies reverse charge when the issuer is VAT-registered', () => {
    expect(resolveLineVatCategory('BG', 'DE', undefined, true, true)).toBe('AE');
  });
});

describe('hasValidVatNumberFormat', () => {
  it('rejects a missing or blank VAT number', () => {
    expect(hasValidVatNumberFormat(null, 'DE')).toBe(false);
    expect(hasValidVatNumberFormat(undefined, 'DE')).toBe(false);
    expect(hasValidVatNumberFormat('   ', 'DE')).toBe(false);
  });

  it('accepts a BG VAT number matching the BG pattern', () => {
    expect(hasValidVatNumberFormat('BG123456789', 'BG')).toBe(true);
  });

  it('rejects a BG VAT number that does not match the BG pattern', () => {
    expect(hasValidVatNumberFormat('BG123', 'BG')).toBe(false);
    expect(hasValidVatNumberFormat('DE123456789', 'BG')).toBe(false);
  });

  it('accepts any non-empty VAT number for a country with no defined pattern', () => {
    expect(hasValidVatNumberFormat('DE123456789', 'DE')).toBe(true);
  });
});
