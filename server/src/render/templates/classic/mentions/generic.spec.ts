import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from '../locale';
import { buildFakeDocument, buildFakeMixedLineItems } from '../testing/fake-document';
import { buildStatutoryMentions } from './index';

describe('genericMentions — BG and generic EU countries without a dedicated builder', () => {
  it('adds the reverse-charge note for BG when a line is AE and the ground does not already say so', () => {
    const document = buildFakeDocument({ vatExemptionGround: 'чл.21 от ЗДДС' });
    const locale = resolveClassicLocale('bg', 'BG');
    const mentions = buildStatutoryMentions({
      document,
      lineItems: buildFakeMixedLineItems(),
      locale,
    });
    expect(mentions).toContain('Обратно начисляване – чл. 21, ал. 2 от ЗДДС');
  });

  it('does not duplicate the note when the exemption ground already states it', () => {
    const document = buildFakeDocument({
      vatExemptionGround: 'Обратно начисляване – чл. 21, ал. 2 от ЗДДС',
    });
    const locale = resolveClassicLocale('bg', 'BG');
    const mentions = buildStatutoryMentions({
      document,
      lineItems: buildFakeMixedLineItems(),
      locale,
    });
    expect(mentions).toEqual([]);
  });

  it('adds nothing when no line is a reverse-charge category', () => {
    const document = buildFakeDocument({ vatExemptionGround: null });
    const locale = resolveClassicLocale('bg', 'BG');
    const mentions = buildStatutoryMentions({
      document,
      lineItems: [],
      locale,
    });
    expect(mentions).toEqual([]);
  });

  it('applies to a generic EU country without a dedicated builder (e.g. NL)', () => {
    const document = buildFakeDocument({ vatExemptionGround: null, issuerCountry: 'NL' });
    const locale = resolveClassicLocale('en', 'NL');
    const mentions = buildStatutoryMentions({
      document,
      lineItems: buildFakeMixedLineItems(),
      locale,
    });
    expect(mentions).toContain('Reverse charge – Article 196 of Council Directive 2006/112/EC');
  });

  it('does not run for a country with its own dedicated builder (DE)', () => {
    const document = buildFakeDocument({ vatExemptionGround: null, issuerCountry: 'DE' });
    const locale = resolveClassicLocale('de', 'DE');
    const mentions = buildStatutoryMentions({
      document,
      lineItems: buildFakeMixedLineItems(),
      locale,
    });
    expect(mentions).not.toContain(
      'Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)',
    );
    expect(mentions).toContain('Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG');
  });
});
