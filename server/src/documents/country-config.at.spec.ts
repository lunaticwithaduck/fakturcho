import {
  AT_JUNGHOLZ_MITTELBERG_POSTCODES,
  getCountryConfig,
  isAtJungholzMittelbergPostcode,
} from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('AT country config', () => {
  const config = getCountryConfig('AT');

  it('carries the current UStG §10 rates with 20% as the standard rate, including the 4,9% staples rate in force since 01.07.2026', () => {
    expect(config.vatRates).toEqual([
      { rateBp: 2000, label: '20%' },
      { rateBp: 1300, label: '13%' },
      { rateBp: 1000, label: '10%' },
      { rateBp: 490, label: '4,9%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(2000);
  });

  it('accepts an official-shape UID (ATU + 8 digits)', () => {
    expect(config.vatNumberPattern?.test('ATU12345678')).toBe(true);
  });

  it('rejects a malformed UID', () => {
    expect(config.vatNumberPattern?.test('AT12345678')).toBe(false);
    expect(config.vatNumberPattern?.test('ATU1234567')).toBe(false);
    expect(config.vatNumberPattern?.test('ATU123456789')).toBe(false);
    expect(config.vatNumberPattern?.test('DE123456789')).toBe(false);
  });

  it('carries the § 6 Abs. 1 Z 27 UStG 1994 Kleinunternehmer note as the default exemption ground', () => {
    expect(config.defaultExemptionGround).toBe(
      'Umsatzsteuerfrei aufgrund der Kleinunternehmerregelung gemäß § 6 Abs. 1 Z 27 UStG 1994.',
    );
  });

  it('does not offer the expired 0% PV rate or an unscoped 19% Jungholz/Mittelberg rate', () => {
    expect(config.vatRates.some((rate) => rate.rateBp === 1900)).toBe(false);
  });

  it('lists every reverse-charge and triangulation ground as a VAT note, not an exemption', () => {
    expect(config.vatNoteGrounds).toEqual([
      'Übergang der Steuerschuld auf den Leistungsempfänger (Reverse Charge) – Leistungsort gemäß § 3a Abs. 6 UStG 1994 im Mitgliedstaat des Leistungsempfängers, Steuerschuldnerschaft des Leistungsempfängers gemäß Art. 196 MwStSystRL.',
      'Innergemeinschaftliches Dreiecksgeschäft gemäß Art. 25 UStG 1994 – die Steuerschuld geht auf den Empfänger über.',
      'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 UStG 1994 (Reverse Charge).',
      'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1a UStG 1994 (Bauleistungen).',
      'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1b UStG 1994.',
      'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1d UStG 1994 iVm § 2 UStBBKV.',
      'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1d UStG 1994 iVm der Schrott-Umsatzsteuerverordnung.',
      'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1e UStG 1994.',
    ]);
  });

  it('offers the intra-Community supply, export and the common domestic exemption grounds', () => {
    expect(config.exemptionGrounds).toContain(
      'Steuerfreie innergemeinschaftliche Lieferung gemäß Art. 6 Abs. 1 iVm Art. 7 UStG 1994 (Binnenmarktregelung).',
    );
    expect(config.exemptionGrounds).toContain(
      'Steuerfreie Ausfuhrlieferung gemäß § 6 Abs. 1 Z 1 iVm § 7 UStG 1994',
    );
    expect(config.exemptionGrounds).toContain(config.defaultExemptionGround);
  });

  it('titles the debit note "Nachtragsrechnung" instead of the German "Belastungsanzeige"', () => {
    expect(config.documentTypeTitles?.debit_note).toBe('Nachtragsrechnung');
  });

  it('carries Firmenbuchgericht, Sitz, Rechtsform and Steuernummer as optional identifiers', () => {
    const optional = ['firmenbuchgericht', 'sitz', 'rechtsform', 'steuernummer'];
    for (const key of optional) {
      const field = config.identifiers.find((entry) => entry.key === key);
      expect(field?.required).toBe(false);
    }
    expect(config.identifiers.find((entry) => entry.key === 'firmenbuchgericht')?.label).toBe(
      'Firmenbuchgericht',
    );
    expect(config.identifiers.find((entry) => entry.key === 'sitz')?.label).toBe('Sitz');
  });

  it('labels the company id field Firmenbuchnummer, not the German Handelsregisternummer', () => {
    expect(config.companyIdLabel).toBe('Firmenbuchnummer');
  });

  it('requires the structured street/postcode/city address but not the Firmenbuchnummer', () => {
    expect(config.requiredIssuerFields).toEqual(['companyName', 'street', 'postcode', 'city']);
  });

  it('prints Leistungsdatum unconditionally, even when it equals the invoice date', () => {
    expect(config.taxEventDateAlwaysShown).toBe(true);
  });

  it('prints no representative, signature row or original stamp', () => {
    expect(config.showMol).toBe(false);
    expect(config.showSignatureRow).toBe(false);
    expect(config.showOriginalStamp).toBe(false);
  });

  it('offers the Jungholz/Mittelberg flag as an optional, unprinted identifier', () => {
    const field = config.identifiers.find((entry) => entry.key === 'jungholzMittelbergRate');
    expect(field).toMatchObject({ required: false, kind: 'flag' });
  });
});

describe('AT country config — § 10 Abs. 4 UStG 1994 Jungholz/Mittelberg 19% rate', () => {
  it('recognises the four Jungholz/Mittelberg postcodes and nothing else', () => {
    expect(AT_JUNGHOLZ_MITTELBERG_POSTCODES).toEqual(['6691', '6991', '6992', '6993']);
    for (const postcode of AT_JUNGHOLZ_MITTELBERG_POSTCODES) {
      expect(isAtJungholzMittelbergPostcode(postcode)).toBe(true);
    }
    expect(isAtJungholzMittelbergPostcode('1060')).toBe(false);
    expect(isAtJungholzMittelbergPostcode(null)).toBe(false);
  });

  it('offers only 20% as the standard rate without the flag set', () => {
    const config = getCountryConfig('AT', { jungholzMittelbergRate: 'false' });
    expect(config.vatRates.some((rate) => rate.rateBp === 1900)).toBe(false);
    expect(config.defaultVatRateBp).toBe(2000);
  });

  it('offers both 19% (default) and 20% once the issuer confirms the flag, reduced rates unchanged', () => {
    const config = getCountryConfig('AT', { jungholzMittelbergRate: 'true' });
    expect(config.vatRates).toEqual([
      { rateBp: 1900, label: '19%' },
      { rateBp: 2000, label: '20%' },
      { rateBp: 1300, label: '13%' },
      { rateBp: 1000, label: '10%' },
      { rateBp: 490, label: '4,9%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(1900);
  });

  it('never applies the AT rate override to another country, even with the same identifier key', () => {
    const config = getCountryConfig('DE', { jungholzMittelbergRate: 'true' });
    expect(config.vatRates.some((rate) => rate.rateBp === 1900 && rate.label === '19%')).toBe(
      true, // DE's own 19% standard rate, unrelated to the AT flag
    );
    expect(config.defaultVatRateBp).toBe(1900);
    expect(config.country).toBe('DE');
  });
});
