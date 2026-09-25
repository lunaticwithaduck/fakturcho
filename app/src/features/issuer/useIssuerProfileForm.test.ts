import { describe, expect, it } from 'vitest';
import {
  computeIssuerFieldErrors,
  hasIssuerFieldErrors,
  type IssuerProfileFormValues,
} from './useIssuerProfileForm';

const BASE: IssuerProfileFormValues = {
  companyName: 'Test SRL',
  eik: '123456789',
  mol: '',
  addressLine: '',
  street: 'Via Roma 1',
  postcode: '00100',
  countyRegion: '',
  city: 'Roma',
  country: 'IT',
  phone: '',
  vatRegistered: false,
  vatNumber: '',
  bankName: '',
  iban: '',
  bic: '',
  altIban: '',
  identifiers: {},
  vatOnCashBasis: false,
  vatOnDebits: false,
};

describe('computeIssuerFieldErrors', () => {
  it('reports nothing when countyRegion is blank', () => {
    expect(computeIssuerFieldErrors(BASE)).toEqual({ identifiers: {} });
  });

  it('flags an IT Provincia that is not two uppercase letters', () => {
    const errors = computeIssuerFieldErrors({ ...BASE, countyRegion: 'Roma' });
    expect(errors.countyRegion).toBe('Provincia');
  });

  it('accepts a well-formed IT Provincia', () => {
    const errors = computeIssuerFieldErrors({ ...BASE, countyRegion: 'RM' });
    expect(errors.countyRegion).toBeUndefined();
  });

  it('does not enforce a pattern for a RO județ (free text)', () => {
    const errors = computeIssuerFieldErrors({ ...BASE, country: 'RO', countyRegion: 'Cluj' });
    expect(errors.countyRegion).toBeUndefined();
  });

  it('flags a malformed FR SIRET identifier', () => {
    const errors = computeIssuerFieldErrors({
      ...BASE,
      country: 'FR',
      identifiers: { siret: '12' },
    });
    expect(errors.identifiers.siret).toBe('SIRET');
  });

  it('accepts a well-formed FR SIRET identifier', () => {
    const errors = computeIssuerFieldErrors({
      ...BASE,
      country: 'FR',
      identifiers: { siret: '73282932000074' },
    });
    expect(errors.identifiers.siret).toBeUndefined();
  });
});

describe('hasIssuerFieldErrors', () => {
  it('is false when nothing is wrong', () => {
    expect(hasIssuerFieldErrors({ identifiers: {} })).toBe(false);
  });

  it('is true when the county/region field is wrong', () => {
    expect(hasIssuerFieldErrors({ countyRegion: 'Provincia', identifiers: {} })).toBe(true);
  });

  it('is true when any identifier is wrong', () => {
    expect(hasIssuerFieldErrors({ identifiers: { siret: 'SIRET' } })).toBe(true);
  });
});
