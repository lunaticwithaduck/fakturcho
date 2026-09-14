import { describe, expect, it } from 'vitest';
import { deriveTownFromAddress } from './address';

describe('deriveTownFromAddress', () => {
  it('returns null for a null address', () => {
    expect(deriveTownFromAddress(null)).toBeNull();
  });

  it('strips a leading postcode from the last comma segment', () => {
    expect(deriveTownFromAddress('Calle Mayor 5, 28013 Madrid')).toBe('Madrid');
  });

  it('returns the last segment unchanged when it carries no postcode', () => {
    expect(deriveTownFromAddress('гр. Пловдив, бул. Свобода 5, Пловдив')).toBe('Пловдив');
  });

  it('returns the whole address when it has no comma', () => {
    expect(deriveTownFromAddress('Madrid')).toBe('Madrid');
  });

  it('returns null for a blank address', () => {
    expect(deriveTownFromAddress('   ')).toBeNull();
  });

  it('handles a hyphenated postcode', () => {
    expect(deriveTownFromAddress('Rue de Paris 1, 75-001 Paris')).toBe('Paris');
  });
});
