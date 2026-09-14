import { describe, expect, it } from 'vitest';
import { resolveDocumentLanguage } from './language';

describe('resolveDocumentLanguage', () => {
  it('defaults to Bulgarian when nothing is set', () => {
    expect(resolveDocumentLanguage(null, null)).toBe('bg');
  });

  it('prefers an explicit documentLanguage over the issuer country', () => {
    expect(resolveDocumentLanguage('en', 'BG')).toBe('en');
    expect(resolveDocumentLanguage('bg', 'DE')).toBe('bg');
  });

  it('derives Bulgarian from a Bulgarian issuer country', () => {
    expect(resolveDocumentLanguage(null, 'BG')).toBe('bg');
  });

  it('derives the language from the issuer country', () => {
    expect(resolveDocumentLanguage(null, 'DE')).toBe('de');
    expect(resolveDocumentLanguage(null, 'FR')).toBe('fr');
    expect(resolveDocumentLanguage(null, 'NL')).toBe('en');
    expect(resolveDocumentLanguage(null, 'US')).toBe('en');
  });

  it('ignores an unrecognised documentLanguage value and falls back to the country', () => {
    expect(resolveDocumentLanguage('xx', 'BG')).toBe('bg');
    expect(resolveDocumentLanguage('xx', 'DE')).toBe('de');
  });
});
