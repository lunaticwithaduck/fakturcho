import { describe, expect, it } from 'vitest';
import { applyLineVatGroups, resolveVatTreatment } from './vat-treatment';

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
