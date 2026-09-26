// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { generateMetadata } from './page';

describe('LocaleLoginPage metadata', () => {
  it('carries an English-only title and the full hreflang set for en', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });

    expect(metadata.title).toEqual({ absolute: 'Log in' });
    expect(metadata.alternates?.canonical).toBe('/en/login');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/login',
      en: '/en/login',
      de: '/de/login',
      fr: '/fr/login',
      it: '/it/login',
      pl: '/pl/login',
      ro: '/ro/login',
      'x-default': '/login',
    });
  });
});
