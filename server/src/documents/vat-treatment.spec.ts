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
