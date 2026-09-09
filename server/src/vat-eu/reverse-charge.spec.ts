import { describe, expect, it } from 'vitest';
import { resolveLineVatCategory } from './reverse-charge';

describe('resolveLineVatCategory', () => {
  it('returns AE when the supply crosses two EU VAT-area countries', () => {
    expect(resolveLineVatCategory('BG', 'DE')).toBe('AE');
  });

  it('ignores the requested category once reverse charge applies', () => {
    expect(resolveLineVatCategory('BG', 'DE', 'S')).toBe('AE');
  });

  it('falls back to the requested category for a domestic supply', () => {
    expect(resolveLineVatCategory('BG', 'BG', 'Z')).toBe('Z');
  });

  it('defaults to S for a domestic supply with no requested category', () => {
    expect(resolveLineVatCategory('BG', 'BG')).toBe('S');
  });

  it('defaults to S when there is no client country', () => {
    expect(resolveLineVatCategory('BG', null)).toBe('S');
  });

  it('does not apply reverse charge outside the EU VAT area', () => {
    expect(resolveLineVatCategory('BG', 'US', 'G')).toBe('G');
  });
});
