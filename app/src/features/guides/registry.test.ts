import type { Locale } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { buildRegistry } from './registry';
import type { GuideContent } from './types';

function stubGuide(country: GuideContent['country'], locale: Locale): GuideContent {
  return {
    country,
    locale,
    slug: `${country.toLowerCase()}-slug`,
    title: `${country} title`,
    description: `${country} description`,
    h1: `${country} h1`,
    answer: `${country} answer`,
    lastReviewed: '2026-09-25',
    sections: [],
    faqHeading: 'FAQ',
    faq: [],
    cta: { heading: 'CTA', body: [] },
  };
}

const GUIDES: GuideContent[] = [
  stubGuide('BG', 'bg'),
  stubGuide('DE', 'de'),
  stubGuide('FR', 'fr'),
  stubGuide('IT', 'it'),
  stubGuide('PL', 'pl'),
  stubGuide('RO', 'ro'),
  stubGuide('ES', 'es'),
  stubGuide('EU', 'en'),
];

const TARGET_COUNTRY_LOCALES: ReadonlyArray<[GuideContent['country'], Locale]> = [
  ['BG', 'bg'],
  ['DE', 'de'],
  ['FR', 'fr'],
  ['IT', 'it'],
  ['PL', 'pl'],
  ['RO', 'ro'],
  ['ES', 'es'],
];

describe('guide registry — country to guide mapping', () => {
  const registry = buildRegistry(GUIDES);

  it.each(TARGET_COUNTRY_LOCALES)('maps issuer country %s to its own guide', (country) => {
    expect(registry.guideForIssuerCountry(country)?.country).toBe(country);
  });

  it('falls back to the EU guide for an unknown issuer country', () => {
    expect(registry.guideForIssuerCountry('US')?.country).toBe('EU');
    expect(registry.guideForIssuerCountry('AT')?.country).toBe('EU');
  });

  it('falls back to the EU guide for a missing issuer country', () => {
    expect(registry.guideForIssuerCountry(null)?.country).toBe('EU');
    expect(registry.guideForIssuerCountry(undefined)?.country).toBe('EU');
  });

  it.each(TARGET_COUNTRY_LOCALES)(
    "maps the landing locale %s -> %s to that country's own guide",
    (country, locale) => {
      expect(registry.guideForLocale(locale)?.country).toBe(country);
    },
  );

  it('maps the en landing locale to the EU overview guide', () => {
    expect(registry.guideForLocale('en')?.country).toBe('EU');
  });

  it('looks up a guide by target country directly for the country-card link', () => {
    expect(registry.guideForTargetCountry('DE')?.slug).toBe('de-slug');
    expect(registry.guideForTargetCountry('ZZ')).toBeUndefined();
  });
});

describe('guide registry — absent content', () => {
  it('every lookup returns undefined without throwing when no guides exist', () => {
    const registry = buildRegistry([]);
    expect(registry.allGuides()).toEqual([]);
    expect(registry.guideForLocale('bg')).toBeUndefined();
    expect(registry.euGuide()).toBeUndefined();
    expect(registry.guideForIssuerCountry('BG')).toBeUndefined();
    expect(registry.getGuide('bg', 'anything')).toBeUndefined();
  });
});

describe('guide registry — lookups', () => {
  const registry = buildRegistry(GUIDES);

  it('getGuide finds a guide by locale + slug', () => {
    expect(registry.getGuide('de', 'de-slug')?.country).toBe('DE');
    expect(registry.getGuide('de', 'wrong-slug')).toBeUndefined();
    expect(registry.getGuide('fr', 'de-slug')).toBeUndefined();
  });

  it('guidesForLocale filters to exactly one guide per published locale here', () => {
    expect(registry.guidesForLocale('de')).toHaveLength(1);
    expect(registry.guidesForLocale('en')).toHaveLength(1);
  });
});
