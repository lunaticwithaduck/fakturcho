// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { metadata } from './page';

describe('LoginPage metadata', () => {
  it('carries the Bulgarian canonical and the en alternate', () => {
    expect(metadata.title).toBe('Вход');
    expect(metadata.alternates?.canonical).toBe('/login');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/login',
      en: '/en/login',
      'x-default': '/login',
    });
  });
});
