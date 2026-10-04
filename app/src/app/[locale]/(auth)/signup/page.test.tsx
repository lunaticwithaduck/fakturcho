// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import LocaleSignupPage, { generateMetadata } from './page';

describe('LocaleSignupPage', () => {
  it('picks the first value when country is repeated in the query string', async () => {
    const element = await LocaleSignupPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ country: ['DE', 'FR'] }),
    });

    expect(element.props.initialCountry).toBe('DE');
  });

  it('passes a plain string country through unchanged', async () => {
    const element = await LocaleSignupPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ country: 'DE' }),
    });

    expect(element.props.initialCountry).toBe('DE');
  });
});

describe('LocaleSignupPage metadata', () => {
  it('carries an English-only title and the full hreflang set for en', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.title).toEqual({ absolute: 'Sign up' });
    expect(metadata.alternates?.canonical).toBe('/en/signup');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/signup',
      en: '/en/signup',
      de: '/de/signup',
      fr: '/fr/signup',
      it: '/it/signup',
      pl: '/pl/signup',
      ro: '/ro/signup',
      'x-default': '/signup',
    });
  });

  it.each(['en', 'de', 'ro'])(
    'keeps only the canonical for %s when a country is in the query',
    async (locale) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({ country: 'AT' }),
      });
      expect(metadata.alternates).toEqual({ canonical: `/${locale}/signup` });
    },
  );
});
