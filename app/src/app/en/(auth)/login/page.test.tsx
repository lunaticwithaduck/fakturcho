// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { metadata } from './page';

describe('EnglishLoginPage metadata', () => {
  it('carries an English-only title and the bg alternate', () => {
    expect(metadata.title).toEqual({ absolute: 'Log in' });
    expect(metadata.alternates?.canonical).toBe('/en/login');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/login',
      en: '/en/login',
    });
  });
});
