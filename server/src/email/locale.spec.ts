import { describe, expect, it } from 'vitest';
import { resolveEmailLocale } from './locale';

describe('resolveEmailLocale', () => {
  it('defaults to bg when nothing is set', () => {
    expect(resolveEmailLocale(null, null, null)).toBe('bg');
  });

  it('honours an explicit documentLanguage over country', () => {
    expect(resolveEmailLocale('en', 'BG', 'BG')).toBe('en');
    expect(resolveEmailLocale('bg', 'DE', 'DE')).toBe('bg');
  });

  it('falls back to the issuer country when documentLanguage is unset', () => {
    expect(resolveEmailLocale(null, 'BG', 'DE')).toBe('bg');
    expect(resolveEmailLocale(null, 'DE', 'BG')).toBe('de');
  });

  it('falls back to the recipient country when issuer country is unset', () => {
    expect(resolveEmailLocale(null, null, 'BG')).toBe('bg');
    expect(resolveEmailLocale(null, null, 'DE')).toBe('de');
  });

  it('ignores an unrecognised documentLanguage value', () => {
    expect(resolveEmailLocale('xx', 'DE', null)).toBe('de');
  });
});
