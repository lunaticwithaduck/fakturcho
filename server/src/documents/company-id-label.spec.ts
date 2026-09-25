import { companyIdLabelFor } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('companyIdLabelFor', () => {
  it('keeps the Cyrillic label for a BG issuer on the bg UI', () => {
    expect(companyIdLabelFor('BG', 'bg')).toBe('ЕИК / Булстат');
  });

  it('gives a readable Latin label for a BG issuer on a non-bg UI', () => {
    expect(companyIdLabelFor('BG', 'en')).toBe('UIC / BULSTAT');
    expect(companyIdLabelFor('BG', 'de')).toBe('UIC / BULSTAT');
  });

  it('leaves other countries alone regardless of the UI locale', () => {
    expect(companyIdLabelFor('DE', 'bg')).toBe('Handelsregisternummer');
    expect(companyIdLabelFor('DE', 'en')).toBe('Handelsregisternummer');
    expect(companyIdLabelFor('FR', 'bg')).toBe('SIREN');
  });
});
