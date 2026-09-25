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
  const AUTOLIQUIDATION =
    'Autoliquidation – TVA due par le preneur, art. 259-1 du CGI et art. 196 de la directive 2006/112/CE';

  it('adds the autoliquidation mention', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', vatExemptionGround: null }),
      lineItems: buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 }),
      locale,
    });

    expect(mentions).toContain(AUTOLIQUIDATION);
  });

  it('does not add a second copy when it is already the document-wide exemption ground printed by the totals block', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({
        issuerCountry: 'FR',
        vatExemptionGround: AUTOLIQUIDATION,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 }),
      locale,
    });

    expect(mentions).not.toContain(AUTOLIQUIDATION);
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

describe('frMentions — option pour le paiement de la taxe d’après les débits', () => {
  it('adds the mention on an invoice when the issuer opted for the debits basis', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', issuerVatOnDebits: true }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toContain("Option pour le paiement de la taxe d'après les débits");
  });

  it('adds no mention when the issuer has not opted for it', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', issuerVatOnDebits: false }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions.some((line) => line.startsWith('Option pour le paiement de la taxe'))).toBe(
      false,
    );
  });

  it('adds the mention on a credit note too, since it states a VAT collection rule, not a payment term', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({
        issuerCountry: 'FR',
        documentType: 'CREDIT_NOTE',
        issuerVatOnDebits: true,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toContain("Option pour le paiement de la taxe d'après les débits");
  });

  it('adds no mention on a quote even when the issuer opted for it', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({
        issuerCountry: 'FR',
        documentType: 'QUOTE',
        issuerVatOnDebits: true,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toEqual([]);
  });
});

describe('frMentions — nature of operation and delivery address', () => {
  it('prints the nature of operation and delivery address for a tax document', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({
        issuerCountry: 'FR',
        operationNature: 'services',
        deliveryAddress: '12 rue de la Gare, 69001 Lyon',
        dueAt: null,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toContain("Nature de l'opération : Prestation de services");
    expect(mentions).toContain('Adresse de livraison : 12 rue de la Gare, 69001 Lyon');
  });

  it('prints the mixed-nature wording', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', operationNature: 'mixed' }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toContain(
      "Nature de l'opération : Livraison de biens et prestation de services",
    );
  });

  it('translates the mention into the chosen document language', () => {
    const enLocale = resolveClassicLocale('en', 'FR');
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', operationNature: 'goods' }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale: enLocale,
    });

    expect(mentions).toContain('Nature of operation: Goods delivery');
  });

  it('omits both lines when neither is set', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({ issuerCountry: 'FR', operationNature: null }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions.some((line) => line.startsWith("Nature de l'opération"))).toBe(false);
    expect(mentions.some((line) => line.startsWith('Adresse de livraison'))).toBe(false);
  });

  it('omits both lines for a non-tax document such as a quote', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({
        issuerCountry: 'FR',
        documentType: 'QUOTE',
        operationNature: 'goods',
        deliveryAddress: '1 rue Test',
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toEqual([]);
  });
});

describe('frMentions — credit note', () => {
  it('carries no payment-terms boilerplate, since nothing is owed by the client', () => {
    const mentions = buildStatutoryMentions({
      document: buildFakeDocument({
        issuerCountry: 'FR',
        documentType: 'CREDIT_NOTE',
        dueAt: new Date('2026-09-15'),
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'S' }),
      locale,
    });

    expect(mentions).toEqual([]);
  });
});
