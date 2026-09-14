import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

const IT_CONFIG = getCountryConfig('IT');

describe('IT_CONFIG', () => {
  it('is a dedicated config, not the generic EU fallback', () => {
    expect(IT_CONFIG.vatNumberPattern).not.toBeNull();
  });

  it('carries the current Italian VAT rates with 22% as default', () => {
    expect(IT_CONFIG.vatRates).toEqual([
      { rateBp: 2200, label: '22%' },
      { rateBp: 1000, label: '10%' },
      { rateBp: 500, label: '5%' },
      { rateBp: 400, label: '4%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(IT_CONFIG.defaultVatRateBp).toBe(2200);
  });

  it('labels the primary identifier as the codice fiscale', () => {
    expect(IT_CONFIG.companyIdLabel).toBe('Codice fiscale');
  });

  describe('vatNumberPattern (Partita IVA)', () => {
    it.each(['IT01234567897', 'IT12345678901'])('accepts %s', (value) => {
      expect(IT_CONFIG.vatNumberPattern?.test(value)).toBe(true);
    });

    it.each(['01234567897', 'IT0123456789', 'IT012345678977', 'DE123456789', 'it01234567897'])(
      'rejects %s',
      (value) => {
        expect(IT_CONFIG.vatNumberPattern?.test(value)).toBe(false);
      },
    );
  });

  it('defaults the exemption ground to the regime forfettario wording', () => {
    expect(IT_CONFIG.defaultExemptionGround).toBe(
      "Operazione senza applicazione dell'IVA ai sensi dell'art. 1, commi da 54 a 89, L. 190/2014",
    );
    expect(IT_CONFIG.exemptionGrounds).toContain(IT_CONFIG.defaultExemptionGround);
  });

  it('lists the statutory exemption grounds used on Italian invoices', () => {
    expect(IT_CONFIG.exemptionGrounds).toEqual([
      "Operazione senza applicazione dell'IVA ai sensi dell'art. 1, commi da 54 a 89, L. 190/2014",
      "Operazione non imponibile ai sensi dell'art. 41, comma 1, lett. a), D.L. 331/1993",
      "Operazione non imponibile ai sensi dell'art. 8, comma 1, lett. a), D.P.R. 633/1972",
      "Operazione esente ai sensi dell'art. 10, D.P.R. 633/1972",
      "Operazione fuori campo IVA ai sensi dell'art. 7-ter, D.P.R. 633/1972",
      "Inversione contabile ai sensi dell'art. 17, comma 6, D.P.R. 633/1972",
    ]);
  });

  it('declares the REA and share capital identifiers, both optional', () => {
    const keys = IT_CONFIG.identifiers.map((field) => field.key);
    expect(keys).toEqual(['rea', 'shareCapital']);
    expect(IT_CONFIG.identifiers.every((field) => !field.required)).toBe(true);
  });

  it('validates the REA identifier format', () => {
    const rea = IT_CONFIG.identifiers.find((field) => field.key === 'rea');
    expect(rea?.pattern?.test('MI-1234567')).toBe(true);
    expect(rea?.pattern?.test('MI1234567')).toBe(false);
    expect(rea?.pattern?.test('milano-1234567')).toBe(false);
  });

  it('requires company name, codice fiscale and full address on the issuer', () => {
    expect(IT_CONFIG.requiredIssuerFields).toEqual([
      'companyName',
      'eik',
      'street',
      'postcode',
      'city',
    ]);
  });

  it('does not show the MOL row, signature row, dual display or original stamp', () => {
    expect(IT_CONFIG.showMol).toBe(false);
    expect(IT_CONFIG.showSignatureRow).toBe(false);
    expect(IT_CONFIG.showDualDisplay).toBe(false);
    expect(IT_CONFIG.showOriginalStamp).toBe(false);
  });

  it('uses Italian as the document language', () => {
    expect(IT_CONFIG.language).toBe('it');
  });
});
