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
  identifiers: {},
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
      country: 'NL',
      addressLine: null,
      street: null,
      postcode: null,
    };
    expect(getMissingIssuerFields(deProfile)).toEqual(['street', 'postcode']);
  });

  it('does not require eik for a non-BG country', () => {
    const deProfile: IssuerProfileDto = {
      ...BASE,
      country: 'NL',
      eik: null,
      street: 'Hauptstr. 1',
      postcode: '10115',
    };
    expect(getMissingIssuerFields(deProfile)).toEqual([]);
  });

  it('requires countyRegion for a RO issuer', () => {
    const roProfile: IssuerProfileDto = {
      ...BASE,
      country: 'RO',
      addressLine: null,
      street: 'Strada Exemplu 1',
      postcode: '010101',
      countyRegion: null,
    };
    expect(getMissingIssuerFields(roProfile)).toEqual(['countyRegion']);
  });

  it('requires street and postcode instead of addressLine for a RO issuer', () => {
    const roProfile: IssuerProfileDto = {
      ...BASE,
      country: 'RO',
      addressLine: null,
      street: null,
      postcode: null,
      countyRegion: 'Cluj',
    };
    expect(getMissingIssuerFields(roProfile)).toEqual(['street', 'postcode']);
  });

  it('is complete for a fully filled RO profile with a județ', () => {
    const roProfile: IssuerProfileDto = {
      ...BASE,
      country: 'RO',
      addressLine: null,
      street: 'Strada Exemplu 1',
      postcode: '010101',
      countyRegion: 'Cluj',
    };
    expect(getMissingIssuerFields(roProfile)).toEqual([]);
  });

  it('does not require countyRegion for an ES issuer', () => {
    const esProfile: IssuerProfileDto = {
      ...BASE,
      country: 'ES',
      addressLine: null,
      street: 'Calle Ejemplo 1',
      postcode: '28001',
      countyRegion: null,
    };
    expect(getMissingIssuerFields(esProfile)).toEqual([]);
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
