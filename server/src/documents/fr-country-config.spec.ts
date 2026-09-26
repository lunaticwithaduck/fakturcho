import { getCountryConfig, PAYMENT_TERMS_DAY_OPTIONS } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { resolveVatTreatment } from './vat-treatment';

const FR = getCountryConfig('FR');

describe('FR country config — VAT rates', () => {
  it('lists the four French rates plus zero, standard at 20%', () => {
    expect(FR.vatRates).toEqual([
      { rateBp: 2000, label: '20%' },
      { rateBp: 1000, label: '10%' },
      { rateBp: 550, label: '5,5%' },
      { rateBp: 210, label: '2,1%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(FR.defaultVatRateBp).toBe(2000);
  });
});

describe('FR country config — identifiers', () => {
  it('uses SIREN as the primary company id label', () => {
    expect(FR.companyIdLabel).toBe('SIREN');
  });

  it('carries SIRET, RCS, legal form and share capital as optional identifiers', () => {
    const keys = FR.identifiers.map((field) => field.key);
    expect(keys).toEqual(['siret', 'rcs', 'legalForm', 'shareCapital']);
    expect(FR.identifiers.every((field) => field.required === false)).toBe(true);
    expect(
      FR.identifiers.find((field) => field.key === 'siret')?.pattern?.test('39442600100019'),
    ).toBe(true);
    expect(FR.identifiers.find((field) => field.key === 'siret')?.pattern?.test('123')).toBe(false);
  });

  it('requires companyName, SIREN, street, postcode and city at issuance', () => {
    expect(FR.requiredIssuerFields).toEqual(['companyName', 'eik', 'street', 'postcode', 'city']);
  });
});

describe('FR country config — VAT number format', () => {
  const pattern = FR.vatNumberPattern;

  it('accepts FR + 2 alphanumeric characters + 9-digit SIREN', () => {
    expect(pattern?.test('FR40394426001')).toBe(true);
    expect(pattern?.test('FRK7399859412')).toBe(true);
  });

  it('rejects a missing prefix, wrong length, or letters inside the SIREN part', () => {
    expect(pattern?.test('DE123456789')).toBe(false);
    expect(pattern?.test('FR4039442600')).toBe(false);
    expect(pattern?.test('FR403944260011')).toBe(false);
    expect(pattern?.test('FR12A45678901')).toBe(false);
  });
});

describe('FR country config — exemption grounds', () => {
  it('forces the franchise-en-base wording for a non-registered issuer', () => {
    expect(FR.defaultExemptionGround).toBe('TVA non applicable, art. 293 B du CGI');
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: false,
      requestedGround: null,
      issuerCountry: 'FR',
    });
    expect(treatment).toEqual({
      vatCharged: false,
      vatRateBp: 0,
      vatExemptionGround: 'TVA non applicable, art. 293 B du CGI',
    });
  });

  it('offers intra-EU, export and reverse-charge grounds to a VAT-registered issuer, never the franchise wording', () => {
    expect(FR.exemptionGrounds).toEqual([
      'Exonération de TVA, article 262 ter I du CGI',
      'Exonération de TVA, article 262 I du CGI',
      'Autoliquidation – TVA due par le preneur, art. 259-1 du CGI et art. 196 de la directive 2006/112/CE',
    ]);
    expect(FR.exemptionGrounds).not.toContain(FR.defaultExemptionGround);
  });

  it('prints every FR ground as a VAT note, without the exemption prefix', () => {
    expect(FR.vatNoteGrounds).toEqual([
      'Autoliquidation – TVA due par le preneur, art. 259-1 du CGI et art. 196 de la directive 2006/112/CE',
      'TVA non applicable, art. 293 B du CGI',
      'Exonération de TVA, article 262 ter I du CGI',
      'Exonération de TVA, article 262 I du CGI',
    ]);
  });

  it('has no exemption line for a VAT-registered issuer at the standard rate', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: true,
      requestedGround: null,
      issuerCountry: 'FR',
    });
    expect(treatment).toEqual({ vatCharged: true, vatRateBp: 2000, vatExemptionGround: null });
  });
});

describe('FR country config — payment terms cap (C. com. art. L441-10 I)', () => {
  it('caps the payment-terms selector at 60 days net from the invoice date', () => {
    expect(FR.maxPaymentTermsDays).toBe(60);
    expect(
      PAYMENT_TERMS_DAY_OPTIONS.every((days) => days <= (FR.maxPaymentTermsDays as number)),
    ).toBe(true);
  });
});

describe('FR country config — no representative/signature/dual-display/original-stamp rows', () => {
  it('has every show* switch off', () => {
    expect(FR.showMol).toBe(false);
    expect(FR.showSignatureRow).toBe(false);
    expect(FR.showOriginalStamp).toBe(false);
  });
});
