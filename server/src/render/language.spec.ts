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

  it('derives English from any non-Bulgarian issuer country', () => {
    expect(resolveDocumentLanguage(null, 'DE')).toBe('en');
    expect(resolveDocumentLanguage(null, 'US')).toBe('en');
  });

  it('ignores an unrecognised documentLanguage value and falls back to the country', () => {
    expect(resolveDocumentLanguage('fr', 'BG')).toBe('bg');
    expect(resolveDocumentLanguage('fr', 'DE')).toBe('en');
  });
});
