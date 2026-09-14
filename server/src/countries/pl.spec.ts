import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('PL country config', () => {
  const config = getCountryConfig('PL');

  it('carries the current standard and reduced VAT rates', () => {
    expect(config.vatRates).toEqual([
      { rateBp: 2300, label: '23%' },
      { rateBp: 800, label: '8%' },
      { rateBp: 500, label: '5%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(2300);
  });

  it('labels the primary identifier NIP', () => {
    expect(config.companyIdLabel).toBe('NIP');
  });

  it('accepts a PL VAT number in the official PL + 10 digits form', () => {
    expect(config.vatNumberPattern?.test('PL1234563218')).toBe(true);
    expect(config.vatNumberPattern?.test('PL5260001246')).toBe(true);
  });

  it('rejects a malformed or foreign VAT number', () => {
    expect(config.vatNumberPattern?.test('1234563218')).toBe(false);
    expect(config.vatNumberPattern?.test('PL123456321')).toBe(false);
    expect(config.vatNumberPattern?.test('PL12345632189')).toBe(false);
    expect(config.vatNumberPattern?.test('DE123456789')).toBe(false);
  });

  it('carries the small-business exemption ground citing art. 113 ust. 1 i 9', () => {
    expect(config.defaultExemptionGround).toContain('art. 113 ust. 1 i 9');
  });

  it('offers the statutory 0%/exemption grounds a VAT-registered issuer can select', () => {
    expect(config.exemptionGrounds).toContain(
      'wewnątrzwspólnotowa dostawa towarów – art. 42 ust. 1 ustawy o podatku od towarów i usług',
    );
    expect(config.exemptionGrounds).toContain(
      'eksport towarów – art. 41 ust. 4 i 5 ustawy o podatku od towarów i usług',
    );
    expect(config.exemptionGrounds).not.toContain(config.defaultExemptionGround);
  });

  it('carries KRS and REGON as optional secondary identifiers', () => {
    const keys = config.identifiers.map((field) => field.key);
    expect(keys).toEqual(['krs', 'regon']);
    expect(config.identifiers.every((field) => field.required === false)).toBe(true);
  });

  it('validates KRS as 10 digits and REGON as 9 or 14 digits', () => {
    const krs = config.identifiers.find((field) => field.key === 'krs');
    const regon = config.identifiers.find((field) => field.key === 'regon');
    expect(krs?.pattern?.test('0000123456')).toBe(true);
    expect(krs?.pattern?.test('123456')).toBe(false);
    expect(regon?.pattern?.test('123456785')).toBe(true);
    expect(regon?.pattern?.test('12345678512345')).toBe(true);
    expect(regon?.pattern?.test('1234567')).toBe(false);
  });

  it('requires the NIP-labelled company id and a full postal address on issuance', () => {
    expect(config.requiredIssuerFields).toEqual([
      'companyName',
      'eik',
      'street',
      'postcode',
      'city',
    ]);
  });

  it('prints no MOL, signature row, dual-currency display or original stamp', () => {
    expect(config.showMol).toBe(false);
    expect(config.showSignatureRow).toBe(false);
    expect(config.showDualDisplay).toBe(false);
    expect(config.showOriginalStamp).toBe(false);
  });

  it('renders documents in Polish', () => {
    expect(config.language).toBe('pl');
  });
});
