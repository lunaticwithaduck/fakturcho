// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { generateMetadata } from './page';

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
      'x-default': '/signup',
    });
  });
});
