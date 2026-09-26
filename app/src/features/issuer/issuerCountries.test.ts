import { EU_VAT_AREA_COUNTRIES, isEuVatAreaCountry } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { ISSUER_COUNTRY_CODES } from './issuerCountries';

describe('ISSUER_COUNTRY_CODES', () => {
  it('does not offer Spain as an issuer country', () => {
    expect(ISSUER_COUNTRY_CODES).not.toContain('ES');
  });

  it('still lists Spain as a valid EU VAT area (client/buyer) country', () => {
    expect(EU_VAT_AREA_COUNTRIES).toContain('ES');
    expect(isEuVatAreaCountry('ES')).toBe(true);
  });

  it('still offers every other EU VAT area country as an issuer country', () => {
    for (const code of EU_VAT_AREA_COUNTRIES) {
      if (code === 'ES') continue;
      expect(ISSUER_COUNTRY_CODES).toContain(code);
    }
  });

  it('offers Bulgaria first', () => {
    expect(ISSUER_COUNTRY_CODES[0]).toBe('BG');
  });
});
