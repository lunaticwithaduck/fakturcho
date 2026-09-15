// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { metadata } from './page';

describe('EnglishSignupPage metadata', () => {
  it('carries an English-only title and the bg alternate', () => {
    expect(metadata.title).toEqual({ absolute: 'Sign up' });
    expect(metadata.alternates?.canonical).toBe('/en/signup');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/signup',
      en: '/en/signup',
    });
  });
});
