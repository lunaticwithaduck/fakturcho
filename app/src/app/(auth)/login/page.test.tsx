// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { metadata } from './page';

describe('LoginPage metadata', () => {
  it('carries the Bulgarian canonical and every published-locale alternate', () => {
    expect(metadata.title).toBe('Вход');
    expect(metadata.alternates?.canonical).toBe('/login');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/login',
      en: '/en/login',
      de: '/de/login',
      fr: '/fr/login',
      it: '/it/login',
      pl: '/pl/login',
      ro: '/ro/login',
      es: '/es/login',
      'x-default': '/login',
    });
  });
});
