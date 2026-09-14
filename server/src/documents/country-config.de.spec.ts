import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('DE country config', () => {
  const config = getCountryConfig('DE');

  it('carries the current UStG §12 rates with 19% as the standard rate', () => {
    expect(config.vatRates).toEqual([
      { rateBp: 1900, label: '19%' },
      { rateBp: 700, label: '7%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(1900);
  });

  it('accepts an official-shape USt-IdNr (DE + 9 digits)', () => {
    expect(config.vatNumberPattern?.test('DE123456789')).toBe(true);
  });

  it('rejects a malformed USt-IdNr', () => {
    expect(config.vatNumberPattern?.test('DE12345678')).toBe(false);
    expect(config.vatNumberPattern?.test('DE1234567890')).toBe(false);
    expect(config.vatNumberPattern?.test('FR123456789')).toBe(false);
    expect(config.vatNumberPattern?.test('DE12345678A')).toBe(false);
  });

  it('carries the §19 UStG small-business note as the default exemption ground', () => {
    expect(config.defaultExemptionGround).toBe(
      'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
    );
  });

  it('offers the intra-community, export and reverse-charge grounds for a VAT-registered issuer', () => {
    expect(config.exemptionGrounds).toEqual([
      'Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG',
      'Steuerfreie Ausfuhrlieferung gemäß § 4 Nr. 1 Buchst. a i. V. m. § 6 UStG',
      'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG',
    ]);
  });

  it('requires the Steuernummer identifier so §14 Abs. 4 Nr. 2 UStG is satisfied without a VAT ID', () => {
    const steuernummer = config.identifiers.find((field) => field.key === 'steuernummer');
    expect(steuernummer).toMatchObject({ label: 'Steuernummer', required: true });
  });

  it('requires the structured street/postcode/city address but not the Handelsregister number', () => {
    expect(config.requiredIssuerFields).toEqual(['companyName', 'street', 'postcode', 'city']);
  });

  it('prints no representative, signature row, dual-currency or original stamp', () => {
    expect(config.showMol).toBe(false);
    expect(config.showSignatureRow).toBe(false);
    expect(config.showDualDisplay).toBe(false);
    expect(config.showOriginalStamp).toBe(false);
  });
});
