import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('ES_CONFIG', () => {
  const config = getCountryConfig('ES');

  it('carries the three current Spanish VAT rates plus exempt', () => {
    expect(config.vatRates).toEqual([
      { rateBp: 2100, label: '21%' },
      { rateBp: 1000, label: '10%' },
      { rateBp: 400, label: '4%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(2100);
  });

  it('labels the primary identifier NIF', () => {
    expect(config.companyIdLabel).toBe('NIF');
  });

  it('accepts official-shape VAT numbers for individuals, foreign residents and entities', () => {
    expect(config.vatNumberPattern?.test('ES12345678Z')).toBe(true);
    expect(config.vatNumberPattern?.test('ESX1234567L')).toBe(true);
    expect(config.vatNumberPattern?.test('ESB12345674')).toBe(true);
  });

  it('rejects a VAT number without the ES prefix or in the wrong shape', () => {
    expect(config.vatNumberPattern?.test('12345678Z')).toBe(false);
    expect(config.vatNumberPattern?.test('ES1234567')).toBe(false);
    expect(config.vatNumberPattern?.test('DE123456789')).toBe(false);
  });

  it('defaults a non-registered issuer to the article 20 ground', () => {
    expect(config.defaultExemptionGround).toBe('artículo 20 de la Ley 37/1992 del IVA');
    expect(config.exemptionGrounds).toContain(config.defaultExemptionGround);
  });

  it('offers the export, assimilated-export, intra-EU and reverse-charge grounds', () => {
    expect(config.exemptionGrounds).toEqual([
      'artículo 20 de la Ley 37/1992 del IVA',
      'artículo 21 de la Ley 37/1992 del IVA',
      'artículo 22 de la Ley 37/1992 del IVA',
      'artículo 25 de la Ley 37/1992 del IVA',
      'artículo 84.Uno.2º de la Ley 37/1992 del IVA',
    ]);
  });

  it('carries the Registro Mercantil identifier as optional', () => {
    expect(config.identifiers).toEqual([
      { key: 'registroMercantil', label: 'Registro Mercantil', pattern: null, required: false },
    ]);
  });

  it('requires the fiscal domicile fields for issuance', () => {
    expect(config.requiredIssuerFields).toEqual([
      'companyName',
      'eik',
      'street',
      'postcode',
      'city',
    ]);
  });

  it('shows none of the Bulgarian-specific extras', () => {
    expect(config.showMol).toBe(false);
    expect(config.showSignatureRow).toBe(false);
    expect(config.showDualDisplay).toBe(false);
    expect(config.showOriginalStamp).toBe(false);
  });
});
