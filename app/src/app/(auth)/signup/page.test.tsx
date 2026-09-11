// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { metadata } from './page';

describe('SignupPage metadata', () => {
  it('carries the Bulgarian canonical and the en alternate', () => {
    expect(metadata.title).toBe('Регистрация');
    expect(metadata.alternates?.canonical).toBe('/signup');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/signup',
      en: '/en/signup',
    });
  });
});
