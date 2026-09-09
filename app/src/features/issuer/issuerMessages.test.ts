import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { describe, expect, it } from 'vitest';
import { ISSUER_COUNTRY_CODES } from './issuerCountries';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [`${prefix}${key}`]
      : flatten(value as Record<string, unknown>, `${prefix}${key}.`),
  );
}

describe('issuer messages', () => {
  it('provides an English translation for every Bulgarian issuer key', () => {
    const bgKeys = flatten(bgMessages.issuer).sort();
    const enKeys = flatten(enMessages.issuer).sort();
    expect(enKeys).toEqual(bgKeys);
  });

  it('has a country label for every selectable issuer country code', () => {
    for (const code of ISSUER_COUNTRY_CODES) {
      expect(bgMessages.issuer.countries).toHaveProperty(code);
      expect(enMessages.issuer.countries).toHaveProperty(code);
    }
  });
});
