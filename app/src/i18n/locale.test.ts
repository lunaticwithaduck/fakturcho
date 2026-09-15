import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, isLocale, localeForPathname } from './locale';

describe('isLocale', () => {
  it('accepts the supported locales', () => {
    expect(isLocale('bg')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(true);
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('it')).toBe(true);
    expect(isLocale('pl')).toBe(true);
    expect(isLocale('ro')).toBe(true);
    expect(isLocale('es')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isLocale('ja')).toBe(false);
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

describe('localeForPathname', () => {
  it('resolves en for the /en root and any subpath', () => {
    expect(localeForPathname('/en')).toBe('en');
    expect(localeForPathname('/en/login')).toBe('en');
    expect(localeForPathname('/en/privacy')).toBe('en');
  });

  it('resolves every other published locale for its own root and subpaths', () => {
    for (const locale of ['de', 'fr', 'it', 'pl', 'ro', 'es'] as const) {
      expect(localeForPathname(`/${locale}`)).toBe(locale);
      expect(localeForPathname(`/${locale}/login`)).toBe(locale);
      expect(localeForPathname(`/${locale}/privacy`)).toBe(locale);
    }
  });

  it('resolves bg for every other path', () => {
    expect(localeForPathname('/')).toBe('bg');
    expect(localeForPathname('/documents')).toBe('bg');
    expect(localeForPathname('/login')).toBe('bg');
  });

  it('does not treat a path merely starting with a locale code as that locale', () => {
    expect(localeForPathname('/entity')).toBe('bg');
    expect(localeForPathname('/design')).toBe('bg');
    expect(localeForPathname('/root')).toBe('bg');
  });
});
