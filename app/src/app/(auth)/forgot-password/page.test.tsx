// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { metadata } from './page';

describe('ForgotPasswordPage metadata', () => {
  it('carries the Bulgarian canonical and every published-locale alternate, noindex', () => {
    expect(metadata.title).toBe('Забравена парола');
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe('/forgot-password');
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
