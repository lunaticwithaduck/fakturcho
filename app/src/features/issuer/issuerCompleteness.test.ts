import type { IssuerProfileDto } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { getMissingIssuerFields } from './issuerCompleteness';

const BASE: IssuerProfileDto = {
  id: '1',
  companyName: 'Тест ЕООД',
  eik: '123456789',
  mol: null,
  addressLine: 'ул. Тестова 1',
  city: 'София',
  phone: null,
  vatRegistered: false,
  vatNumber: null,
  bankName: null,
  iban: null,
  bic: null,
  altIban: null,
};

describe('getMissingIssuerFields', () => {
  it('reports nothing missing for a complete non-VAT-registered profile', () => {
    expect(getMissingIssuerFields(BASE)).toEqual([]);
  });

  it('lists every blank required field', () => {
    const profile: IssuerProfileDto = { ...BASE, companyName: null, city: '  ' };
    expect(getMissingIssuerFields(profile)).toEqual(['Фирма', 'Град']);
  });

  it('requires a VAT number only when VAT-registered', () => {
    const registeredWithout: IssuerProfileDto = { ...BASE, vatRegistered: true, vatNumber: null };
    expect(getMissingIssuerFields(registeredWithout)).toEqual(['ДДС номер']);

    const registeredWith: IssuerProfileDto = {
      ...BASE,
      vatRegistered: true,
      vatNumber: 'BG123456789',
    };
    expect(getMissingIssuerFields(registeredWith)).toEqual([]);
  });
});
