// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { metadata } from './page';

describe('SignupPage metadata', () => {
  it('carries the Bulgarian canonical and every published-locale alternate', () => {
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
});
