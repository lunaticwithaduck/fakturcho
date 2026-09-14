import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from '../locale';
import { buildFakeDocument, buildFakeLineItems } from '../testing/fake-document';
import { buildStatutoryMentions } from './index';

const locale = resolveClassicLocale('fr', 'FR');

describe('frMentions — standard-rate invoice', () => {
  it('carries the payment-terms boilerplate and no VAT-exemption mention', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', dueAt: new Date('2026-09-15') }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toContain("Date d'échéance : 15/09/2026");
    expect(mentions).toContain('Escompte pour paiement anticipé : néant');
    expect(mentions).toContain('Indemnité forfaitaire pour frais de recouvrement : 40 €');
    expect(mentions.some((line) => line.includes('BCE'))).toBe(true);
    expect(mentions.some((line) => line.includes('Autoliquidation'))).toBe(false);
    expect(mentions.some((line) => line.includes('262 ter'))).toBe(false);
  });

  it('omits the due-date line when there is no due date', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', dueAt: null }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions.some((line) => line.startsWith("Date d'échéance"))).toBe(false);
  });
});

describe('frMentions — reverse charge (AE)', () => {
  it('adds the autoliquidation mention', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', vatExemptionGround: null }),
      lineItems: buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 }),
      locale,
    });

    expect(mentions).toContain('Autoliquidation, article 283 du CGI');
  });

  it('does not add a second copy when it is already the document-wide exemption ground printed by the totals block', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({
        issuerCountry: 'FR',
        vatExemptionGround: 'Autoliquidation, article 283 du CGI',
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 }),
      locale,
    });

    expect(mentions).not.toContain('Autoliquidation, article 283 du CGI');
  });
});

describe('frMentions — intra-community supply (K) and export (G)', () => {
  it('adds the intra-community exemption mention for a K line', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR' }),
      lineItems: buildFakeLineItems({ vatCategory: 'K', vatRateBp: 0 }),
      locale,
    });

    expect(mentions).toContain('Exonération de TVA, article 262 ter I du CGI');
  });

  it('adds the export exemption mention for a G line', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR' }),
      lineItems: buildFakeLineItems({ vatCategory: 'G', vatRateBp: 0 }),
      locale,
    });

    expect(mentions).toContain('Exonération de TVA, article 262 I du CGI');
  });
});

describe('frMentions — non-tax documents', () => {
  it('carries no payment-terms boilerplate on a quote', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({
        issuerCountry: 'FR',
        documentType: 'QUOTE',
        dueAt: new Date('2026-09-15'),
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toEqual([]);
  });
});
