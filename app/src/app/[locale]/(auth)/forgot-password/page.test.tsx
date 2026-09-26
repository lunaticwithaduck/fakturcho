// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { generateMetadata } from './page';

describe('LocaleForgotPasswordPage metadata', () => {
  it('carries an English-only title and the full hreflang set for en', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });

    expect(metadata.title).toEqual({ absolute: 'Forgot password' });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe('/en/forgot-password');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/forgot-password',
      en: '/en/forgot-password',
      de: '/de/forgot-password',
      fr: '/fr/forgot-password',
      it: '/it/forgot-password',
      pl: '/pl/forgot-password',
      ro: '/ro/forgot-password',
      'x-default': '/forgot-password',
    });
  });
});
