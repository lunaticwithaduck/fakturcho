import { describe, expect, it } from 'vitest';
import { DomainError } from '../common/domain-error';
import { applyLineVatGroups, resolveVatTreatment } from './vat-treatment';

describe('resolveVatTreatment', () => {
  it('uses the country default ground for a non-registered issuer', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: false,
      requestedGround: null,
      issuerCountry: 'DE',
    });
    expect(treatment).toEqual({
      vatCharged: false,
      vatRateBp: 0,
      vatExemptionGround: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
    });
  });

  it('requires an explicit ground for a non-registered ES issuer (no franchise regime)', () => {
    expect(() =>
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: false,
        requestedGround: null,
        issuerCountry: 'ES',
      }),
    ).toThrow(DomainError);
    expect(() =>
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: false,
        requestedGround: null,
        issuerCountry: 'ES',
      }),
    ).toThrow(/ES has no default VAT exemption ground/);
  });

  it('accepts the apartado the non-registered ES issuer picked', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: false,
      requestedGround: 'artículo 20.Uno.9º de la Ley 37/1992 del IVA',
      issuerCountry: 'ES',
    });
    expect(treatment).toEqual({
      vatCharged: false,
      vatRateBp: 0,
      vatExemptionGround: 'artículo 20.Uno.9º de la Ley 37/1992 del IVA',
    });
  });

  it('does not require a ground for a non-tax document from a non-registered ES issuer', () => {
    const treatment = resolveVatTreatment({
      documentType: 'quote',
      vatRegistered: false,
      requestedGround: null,
      issuerCountry: 'ES',
    });
    expect(treatment).toEqual({ vatCharged: false, vatRateBp: 0, vatExemptionGround: null });
  });

  it('rejects an apartado outside the ES statutory list', () => {
    expect(() =>
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: false,
        requestedGround: 'foo',
        issuerCountry: 'ES',
      }),
    ).toThrow(DomainError);
  });

  it('rejects a made-up ground for a VAT-registered issuer at 0%', () => {
    expect(() =>
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: true,
        requestedGround: 'foo',
        issuerCountry: 'BG',
      }),
    ).toThrow(DomainError);
  });

  it("rejects another country's ground for a VAT-registered issuer at 0%", () => {
    expect(() =>
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: true,
        requestedGround: 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG',
        issuerCountry: 'BG',
      }),
    ).toThrow(DomainError);
  });

  it('accepts the BG default ground when explicitly re-requested by a non-registered issuer', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: false,
      requestedGround: 'чл.113, ал.9 от ЗДДС',
      issuerCountry: 'BG',
    });
    expect(treatment.vatExemptionGround).toBe('чл.113, ал.9 от ЗДДС');
  });

  it('no longer dead-ends a non-registered generic-EU issuer: the SME ground applies automatically', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: false,
      requestedGround: null,
      issuerCountry: 'NL',
    });
    expect(treatment.vatExemptionGround).toBe(
      'VAT exemption for small enterprises, Article 284 of Council Directive 2006/112/EC',
    );
  });

  it('rejects a made-up ground for a VAT-registered generic-EU issuer at 0%', () => {
    expect(() =>
      resolveVatTreatment({
        documentType: 'invoice',
        vatRegistered: true,
        requestedGround: 'foo',
        issuerCountry: 'NL',
      }),
    ).toThrow(DomainError);
  });

  it('accepts a statutory ground for a VAT-registered generic-EU issuer at 0%', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: true,
      requestedGround: 'Reverse charge, Article 196 of Council Directive 2006/112/EC',
      issuerCountry: 'NL',
    });
    expect(treatment.vatExemptionGround).toBe(
      'Reverse charge, Article 196 of Council Directive 2006/112/EC',
    );
  });
});

describe('applyLineVatGroups', () => {
  it('leaves a uniform standard-rate document unchanged', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: true,
      requestedGround: null,
      issuerCountry: 'BG',
    });
    const result = applyLineVatGroups(treatment, [
      { vatCategory: 'S', vatRateBp: 2000 },
      { vatCategory: 'S', vatRateBp: 2000 },
    ]);
    expect(result).toEqual({ vatCharged: true, vatRateBp: 2000, vatExemptionGround: null });
  });

  it('leaves a uniformly exempt document unchanged', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: false,
      requestedGround: null,
      issuerCountry: 'BG',
    });
    const result = applyLineVatGroups(treatment, [{ vatCategory: 'O', vatRateBp: 0 }]);
    expect(result).toBe(treatment);
  });

  it('leaves a uniformly reverse-charged document unchanged', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: true,
      requestedGround: 'чл.21 от ЗДДС',
      issuerCountry: 'BG',
    });
    const result = applyLineVatGroups(treatment, [
      { vatCategory: 'AE', vatRateBp: 0 },
      { vatCategory: 'AE', vatRateBp: 0 },
    ]);
    expect(result).toBe(treatment);
  });

  it('un-zeroes a mixed reverse-charge + standard-rate document, keeping the ground', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: true,
      requestedGround: 'чл.21 от ЗДДС',
      issuerCountry: 'BG',
    });
    const result = applyLineVatGroups(treatment, [
      { vatCategory: 'AE', vatRateBp: 0 },
      { vatCategory: 'S', vatRateBp: 2000 },
    ]);
    expect(result).toEqual({
      vatCharged: true,
      vatRateBp: 2000,
      vatExemptionGround: 'чл.21 от ЗДДС',
    });
  });

  it('zeroes a document that turns out fully reverse-charged with no requested ground', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: true,
      requestedGround: null,
      issuerCountry: 'DE',
    });
    const result = applyLineVatGroups(treatment, [{ vatCategory: 'AE', vatRateBp: 0 }]);
    expect(result).toEqual({ vatCharged: false, vatRateBp: 0, vatExemptionGround: null });
  });

  it('un-zeroes a mixed standard-rate + zero-rated document', () => {
    const treatment = resolveVatTreatment({
      documentType: 'invoice',
      vatRegistered: true,
      requestedGround: 'чл.30 ал.1 от ЗДДС',
      issuerCountry: 'BG',
    });
    const result = applyLineVatGroups(treatment, [
      { vatCategory: 'S', vatRateBp: 2000 },
      { vatCategory: 'Z', vatRateBp: 0 },
    ]);
    expect(result).toEqual({
      vatCharged: true,
      vatRateBp: 2000,
      vatExemptionGround: 'чл.30 ал.1 от ЗДДС',
    });
  });
});
