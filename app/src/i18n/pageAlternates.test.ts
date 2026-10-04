import { describe, expect, it } from 'vitest';
import { pageAlternates } from './pageAlternates';

describe('pageAlternates', () => {
  it('carries the canonical and the full hreflang set on the clean URL', () => {
    const alternates = pageAlternates('/signup', 'de', {});
    expect(alternates?.canonical).toBe('/de/signup');
    expect(alternates?.languages).toMatchObject({
      de: '/de/signup',
      bg: '/signup',
      'x-default': '/signup',
    });
  });

  it('keeps only the canonical on a query-string variant, which is not a language version', () => {
    expect(pageAlternates('/signup', 'en', { country: 'DE' })).toEqual({
      canonical: '/en/signup',
    });
  });
});
