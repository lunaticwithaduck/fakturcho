// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { generateMetadata } from './page';

describe('SignupPage metadata', () => {
  it('carries the Bulgarian canonical and every published-locale alternate', async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata.title).toBe('Регистрация');
    expect(metadata.alternates?.canonical).toBe('/signup');
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

  it('drops the alternates on a query-string variant', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ country: 'DE' }),
    });
    expect(metadata.alternates).toEqual({ canonical: '/signup' });
  });
});
