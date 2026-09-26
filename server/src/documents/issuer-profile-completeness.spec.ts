import type { IssuerProfileDto } from '@fakturcho/shared-types';
import { isIssuerProfileComplete } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

const BASE: IssuerProfileDto = {
  id: '1',
  companyName: 'Test s.r.o.',
  eik: null,
  mol: null,
  addressLine: null,
  street: 'Václavské náměstí 1',
  postcode: '110 00',
  countyRegion: null,
  city: 'Praha',
  country: 'CZ',
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
  vatOnCashBasis: false,
  vatOnDebits: false,
  defaultPaymentTermsDays: null,
};

describe('isIssuerProfileComplete — CZ (NOZ § 435 odst. 1)', () => {
  it('is incomplete without the company-register identifier', () => {
    expect(isIssuerProfileComplete(BASE)).toBe(false);
  });

  it('is complete once the company-register identifier is set', () => {
    const profile: IssuerProfileDto = {
      ...BASE,
      identifiers: { companyRegister: 'C 12345 vedená u Městského soudu v Praze' },
    };
    expect(isIssuerProfileComplete(profile)).toBe(true);
  });
});

describe('isIssuerProfileComplete — DE (§ 37a HGB, § 35a GmbHG)', () => {
  const deBase: IssuerProfileDto = {
    ...BASE,
    country: 'DE',
    street: 'Musterstraße 1',
    postcode: '10115',
    city: 'Berlin',
    identifiers: { steuernummer: '21/815/08150' },
  };

  it('is complete for a sole trader with no Handelsregisternummer at all', () => {
    expect(isIssuerProfileComplete(deBase)).toBe(true);
  });

  it('is incomplete once a Handelsregisternummer is entered without Registergericht/Sitz', () => {
    const profile: IssuerProfileDto = { ...deBase, eik: 'HRB 12345' };
    expect(isIssuerProfileComplete(profile)).toBe(false);
  });

  it('is complete once Registergericht and Sitz are also set', () => {
    const profile: IssuerProfileDto = {
      ...deBase,
      eik: 'HRB 12345',
      identifiers: {
        ...deBase.identifiers,
        registergericht: 'Amtsgericht Charlottenburg',
        sitz: 'Berlin',
      },
    };
    expect(isIssuerProfileComplete(profile)).toBe(true);
  });

  it('is still incomplete with only Registergericht and not Sitz', () => {
    const profile: IssuerProfileDto = {
      ...deBase,
      eik: 'HRB 12345',
      identifiers: { ...deBase.identifiers, registergericht: 'Amtsgericht Charlottenburg' },
    };
    expect(isIssuerProfileComplete(profile)).toBe(false);
  });
});
