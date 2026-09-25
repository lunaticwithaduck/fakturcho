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

  it('carries the § 19 Abs. 1 UStG small-business note as the default exemption ground', () => {
    expect(config.defaultExemptionGround).toBe(
      'Steuerbefreiung für Kleinunternehmer gemäß § 19 Abs. 1 UStG.',
    );
  });

  it('offers the intra-community, export, both reverse-charge and the common domestic exemption grounds', () => {
    expect(config.exemptionGrounds).toEqual([
      'Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG',
      'Steuerfreie Ausfuhrlieferung gemäß § 4 Nr. 1 Buchst. a i. V. m. § 6 UStG',
      'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG',
      'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)',
      'Steuerfreie Finanzumsätze gemäß § 4 Nr. 8 UStG',
      'Steuerfreie Umsätze aus der Tätigkeit als Versicherungsvertreter oder -makler gemäß § 4 Nr. 11 UStG',
      'Steuerfreie Vermietung und Verpachtung gemäß § 4 Nr. 12 UStG',
      'Steuerfreie Heilbehandlung gemäß § 4 Nr. 14 UStG',
      'Steuerfreie Bildungsleistung gemäß § 4 Nr. 21 UStG',
    ]);
  });

  it('lists both reverse-charge grounds as VAT notes, not exemptions', () => {
    expect(config.vatNoteGrounds).toEqual([
      'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG',
      'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)',
    ]);
  });

  it('requires the Steuernummer identifier so §14 Abs. 4 Nr. 2 UStG is satisfied without a VAT ID', () => {
    const steuernummer = config.identifiers.find((field) => field.key === 'steuernummer');
    expect(steuernummer).toMatchObject({ label: 'Steuernummer', required: true });
  });

  it('requires the structured street/postcode/city address but not the Handelsregister number', () => {
    expect(config.requiredIssuerFields).toEqual(['companyName', 'street', 'postcode', 'city']);
  });

  it('prints no representative, signature row or original stamp', () => {
    expect(config.showMol).toBe(false);
    expect(config.showSignatureRow).toBe(false);
    expect(config.showOriginalStamp).toBe(false);
  });
});
