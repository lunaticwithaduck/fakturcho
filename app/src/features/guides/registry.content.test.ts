import { PUBLISHED_LOCALES, TARGET_COUNTRIES } from '@shared/types';
import { describe, expect, it } from 'vitest';
import {
  getGuide,
  guideForIssuerCountry,
  guideForLocale,
  guideForTargetCountry,
  guideHref,
  guidesForLocale,
} from './registry';

const EXPECTED_HREF: Record<string, string> = {
  BG: '/guide/faktura-zadalzhitelni-rekviziti-zdds',
  DE: '/de/guide/rechnung-pflichtangaben-e-rechnung',
  AT: '/de/guide/rechnung-oesterreich-pflichtangaben-ustg',
  FR: '/fr/guide/mentions-obligatoires-facture-france',
  IT: '/it/guide/fattura-elettronica-obbligatoria',
  PL: '/pl/guide/faktura-ksef',
  RO: '/ro/guide/factura-efactura-anaf-spv',
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

  it.each(['NL', '', null, undefined])(
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

describe('shipped guides — Austria, published in every app language (not just its own)', () => {
  const AT_HREF_BY_LOCALE: Record<string, string> = {
    bg: '/guide/faktura-avstriya-zadalzhitelni-rekviziti',
    de: '/de/guide/rechnung-oesterreich-pflichtangaben-ustg',
    en: '/en/guide/austria-invoice-requirements-vat-rates',
    fr: '/fr/guide/facture-autriche-mentions-obligatoires',
    it: '/it/guide/fattura-austria-requisiti-obbligatori',
    pl: '/pl/guide/faktura-austria-wymogi-vat',
    ro: '/ro/guide/factura-austria-cerinte-tva',
  };

  it('issuer country AT opens its own (German) guide, not the EU fallback', () => {
    const guide = guideForIssuerCountry('AT');
    expect(guide?.country).toBe('AT');
    expect(guide?.locale).toBe('de');
    expect(guide && guideHref(guide)).toBe(AT_HREF_BY_LOCALE.de);
  });

  it('the country card for AT links the same German guide', () => {
    const guide = guideForTargetCountry('AT');
    expect(guide?.locale).toBe('de');
    expect(guide && guideHref(guide)).toBe(AT_HREF_BY_LOCALE.de);
  });

  it.each(Object.entries(AT_HREF_BY_LOCALE))(
    'has an AT guide reachable at %s -> %s, in that language',
    (locale, href) => {
      const guides = guidesForLocale(locale as (typeof PUBLISHED_LOCALES)[number]);
      const atGuide = guides.find((guide) => guide.country === 'AT');
      expect(atGuide?.locale).toBe(locale);
      expect(atGuide && guideHref(atGuide)).toBe(href);
    },
  );

  it('does not replace Germany or Bulgaria as the flagship guide for their own locale', () => {
    expect(guideForLocale('de')?.country).toBe('DE');
    expect(guideForLocale('bg')?.country).toBe('BG');
    expect(guidesForLocale('de')).toHaveLength(2);
    expect(guidesForLocale('bg')).toHaveLength(2);
  });

  it('carries no Spanish AT guide (a parallel worker is removing Spanish)', () => {
    const guides = guidesForLocale('es' as (typeof PUBLISHED_LOCALES)[number]);
    expect(guides.some((guide) => guide.country === 'AT')).toBe(false);
  });
});
