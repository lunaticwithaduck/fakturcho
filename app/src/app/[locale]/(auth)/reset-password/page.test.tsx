// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { generateMetadata } from './page';

describe('LocaleResetPasswordPage metadata', () => {
  it('carries an English-only title and the full hreflang set for en', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });

    expect(metadata.title).toBe('Reset password');
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe('/en/reset-password');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/reset-password',
      en: '/en/reset-password',
      de: '/de/reset-password',
      fr: '/fr/reset-password',
      it: '/it/reset-password',
      pl: '/pl/reset-password',
      ro: '/ro/reset-password',
      'x-default': '/reset-password',
    });
  });
});
