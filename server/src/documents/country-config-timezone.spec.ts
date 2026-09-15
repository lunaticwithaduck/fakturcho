import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('CountryConfig.timeZone', () => {
  it.each([
    ['BG', 'Europe/Sofia'],
    ['DE', 'Europe/Berlin'],
    ['FR', 'Europe/Paris'],
    ['IT', 'Europe/Rome'],
    ['PL', 'Europe/Warsaw'],
    ['RO', 'Europe/Bucharest'],
    ['ES', 'Europe/Madrid'],
  ])('gives %s its capital IANA zone', (country, timeZone) => {
    expect(getCountryConfig(country).timeZone).toBe(timeZone);
  });

  it('is a real IANA zone Intl can resolve for every configured country', () => {
    for (const country of ['BG', 'DE', 'FR', 'IT', 'PL', 'RO', 'ES']) {
      const { timeZone } = getCountryConfig(country);
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone })).not.toThrow();
    }
  });

  it('falls back to a real zone for an unconfigured EU or non-EU country', () => {
    expect(
      () => new Intl.DateTimeFormat('en-US', { timeZone: getCountryConfig('NL').timeZone }),
    ).not.toThrow();
    expect(
      () => new Intl.DateTimeFormat('en-US', { timeZone: getCountryConfig('US').timeZone }),
    ).not.toThrow();
  });
});
