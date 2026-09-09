import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, isLocale } from './locale';

describe('isLocale', () => {
  it('accepts the supported locales', () => {
    expect(isLocale('bg')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe('DEFAULT_LOCALE', () => {
  it('is Bulgarian', () => {
    expect(DEFAULT_LOCALE).toBe('bg');
  });
});
