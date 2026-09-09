import type { IssuerProfileDto } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { getMissingIssuerFields } from './issuerCompleteness';

const BASE: IssuerProfileDto = {
  id: '1',
  companyName: 'Тест ЕООД',
  eik: '123456789',
  mol: null,
  addressLine: 'ул. Тестова 1',
  street: null,
  postcode: null,
  countyRegion: null,
  city: 'София',
  country: 'BG',
  phone: null,
  vatRegistered: false,
  vatNumber: null,
  bankName: null,
  iban: null,
  bic: null,
  altIban: null,
  peppolEndpointId: null,
  peppolScheme: null,
};

describe('getMissingIssuerFields', () => {
  it('reports nothing missing for a complete non-VAT-registered BG profile', () => {
    expect(getMissingIssuerFields(BASE)).toEqual([]);
  });

  it('lists every blank required field for BG', () => {
    const profile: IssuerProfileDto = { ...BASE, companyName: null, city: '  ' };
    expect(getMissingIssuerFields(profile)).toEqual(['companyName', 'city']);
  });

  it('requires a VAT number only when VAT-registered', () => {
    const registeredWithout: IssuerProfileDto = { ...BASE, vatRegistered: true, vatNumber: null };
    expect(getMissingIssuerFields(registeredWithout)).toEqual(['vatNumber']);

    const registeredWith: IssuerProfileDto = {
      ...BASE,
      vatRegistered: true,
      vatNumber: 'BG123456789',
    };
    expect(getMissingIssuerFields(registeredWith)).toEqual([]);
  });

  it('requires street and postcode instead of addressLine for a non-BG country', () => {
    const deProfile: IssuerProfileDto = {
      ...BASE,
      country: 'DE',
      addressLine: null,
      street: null,
      postcode: null,
    };
    expect(getMissingIssuerFields(deProfile)).toEqual(['street', 'postcode']);
  });

  it('does not require eik for a non-BG country', () => {
    const deProfile: IssuerProfileDto = {
      ...BASE,
      country: 'DE',
      eik: null,
      street: 'Hauptstr. 1',
      postcode: '10115',
    };
    expect(getMissingIssuerFields(deProfile)).toEqual([]);
  });

  it('is complete for a fully filled non-EU country profile', () => {
    const usProfile: IssuerProfileDto = {
      ...BASE,
      country: 'US',
      eik: null,
      addressLine: null,
      street: '1 Main St',
      postcode: '10001',
    };
    expect(getMissingIssuerFields(usProfile)).toEqual([]);
  });
});
