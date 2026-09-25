import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from './locale';
import { buildTitle } from './title';

describe('RO stage-1 legal fixes', () => {
  it('lists the B2B-services-to-the-EU ground and marks it a VAT note, not an exemption', () => {
    const country = getCountryConfig('RO');
    const ground = 'Neimpozabil în România conform art. 278 alin. (2) din Codul fiscal';
    expect(country.exemptionGrounds).toContain(ground);
    expect(country.vatNoteGrounds).toContain(ground);
  });

  it('keeps the intra-EU goods ground (art. 294 alin. (2) lit. a)) distinct from the export ground (art. 294 alin. (1) lit. a))', () => {
    const country = getCountryConfig('RO');
    expect(country.exemptionGrounds).toContain(
      'Scutit cu drept de deducere conform art. 294 alin. (1) lit. a) din Codul fiscal',
    );
    expect(country.exemptionGrounds).toContain(
      'Scutit cu drept de deducere conform art. 294 alin. (2) lit. a) din Codul fiscal',
    );
  });

  it('titles a downward correction "Factură de stornare" and an upward one "Factură de corecție" (Codul fiscal art. 330 has no separate note types)', () => {
    const locale = resolveClassicLocale('ro', 'RO');
    expect(buildTitle('credit_note', null, 42, null, locale)).toBe(
      'Factură de stornare nr. 0000000042',
    );
    expect(buildTitle('debit_note', null, 7, null, locale)).toBe(
      'Factură de corecție nr. 0000000007',
    );
  });
});
