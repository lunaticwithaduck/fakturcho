import { EU_VAT_AREA_COUNTRIES, getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

const COUNTRIES_WITH_GENUINE_20_PERCENT_STANDARD_RATE = new Set(['BG', 'FR', 'AT']);

describe('getCountryConfig VAT rates for countries without a dedicated config', () => {
  it('gives Ireland the 23% standard rate', () => {
    expect(getCountryConfig('IE').defaultVatRateBp).toBe(2300);
  });

  it('gives the Netherlands the 21% standard rate', () => {
    expect(getCountryConfig('NL').defaultVatRateBp).toBe(2100);
  });

  it('gives Austria the 20% standard rate', () => {
    expect(getCountryConfig('AT').defaultVatRateBp).toBe(2000);
  });

  it('gives Hungary the 27% standard rate', () => {
    expect(getCountryConfig('HU').defaultVatRateBp).toBe(2700);
  });

  it('gives Luxembourg the 17% standard rate', () => {
    expect(getCountryConfig('LU').defaultVatRateBp).toBe(1700);
  });

  it('gives Finland the 25.5% standard rate', () => {
    expect(getCountryConfig('FI').defaultVatRateBp).toBe(2550);
  });

  it('gives Spain the 21% standard rate, unconfigured as an issuer but still a real EU VAT area country', () => {
    expect(getCountryConfig('ES').defaultVatRateBp).toBe(2100);
  });

  it('resolves every EU_VAT_AREA_COUNTRIES entry away from the generic 20% fallback', () => {
    for (const country of EU_VAT_AREA_COUNTRIES) {
      const { defaultVatRateBp } = getCountryConfig(country);
      if (defaultVatRateBp === 2000) {
        expect(COUNTRIES_WITH_GENUINE_20_PERCENT_STANDARD_RATE.has(country)).toBe(true);
      }
    }
  });

  it('gives each of those countries its own capital time zone instead of Europe/Brussels', () => {
    expect(getCountryConfig('IE').timeZone).toBe('Europe/Dublin');
    expect(getCountryConfig('FI').timeZone).toBe('Europe/Helsinki');
    expect(getCountryConfig('CY').timeZone).toBe('Asia/Nicosia');
  });
});
