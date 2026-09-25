import { PUBLISHED_LOCALES, TARGET_COUNTRIES } from '@shared/types';
import { describe, expect, it } from 'vitest';
import {
  getGuide,
  guideForIssuerCountry,
  guideForLocale,
  guideForTargetCountry,
  guideHref,
} from './registry';

const EXPECTED_HREF: Record<string, string> = {
  BG: '/guide/faktura-zadalzhitelni-rekviziti-zdds',
  DE: '/de/guide/rechnung-pflichtangaben-e-rechnung',
  FR: '/fr/guide/mentions-obligatoires-facture-france',
  IT: '/it/guide/fattura-elettronica-obbligatoria',
  PL: '/pl/guide/faktura-ksef',
  RO: '/ro/guide/factura-efactura-anaf-spv',
  ES: '/es/guide/factura-obligatoria-espana',
};
const EU_HREF = '/en/guide/eu-vat-invoice-requirements';

describe('shipped guides — each country gets its own page', () => {
  it.each(TARGET_COUNTRIES)('issuer country %s opens its own guide', (country) => {
    const guide = guideForIssuerCountry(country);
    expect(guide?.country).toBe(country);
    expect(guide && guideHref(guide)).toBe(EXPECTED_HREF[country]);
  });

  it.each(TARGET_COUNTRIES)('country card %s links its own guide', (country) => {
    const guide = guideForTargetCountry(country);
    expect(guide && guideHref(guide)).toBe(EXPECTED_HREF[country]);
  });

  it.each(['NL', 'AT', '', null, undefined])(
    'issuer country %s falls back to the EU guide',
    (country) => {
      const guide = guideForIssuerCountry(country);
      expect(guide && guideHref(guide)).toBe(EU_HREF);
    },
  );

  it.each(PUBLISHED_LOCALES)('landing locale %s links a guide in its own language', (locale) => {
    const guide = guideForLocale(locale);
    expect(guide?.locale).toBe(locale);
    expect(guide && getGuide(locale, guide.slug)).toBe(guide);
  });
});
