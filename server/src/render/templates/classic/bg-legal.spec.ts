import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { amountInWords } from '../../../money/amount-in-words';
import { bg } from './labels/bg';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const presentation = { vatCharged: true, showExemptionLine: false, exemptionGround: null };

describe('BG exemption grounds — legal review fixes', () => {
  const grounds = getCountryConfig('BG').exemptionGrounds;

  it('cites чл. 21, ал. 2 for the reverse-charge ground, not the bare article', () => {
    expect(grounds).toContain('Обратно начисляване – чл. 21, ал. 2 от ЗДДС');
    expect(grounds).not.toContain('чл.21 от ЗДДС');
  });

  it('includes the intra-EU supply of goods ground (чл. 53, ал. 1)', () => {
    expect(grounds).toContain('чл. 53, ал. 1 от ЗДДС');
  });

  it('cites the current directive for triangular trade, not the repealed 6th Directive', () => {
    expect(grounds).toContain('чл. 141 2006/112/ЕО');
    expect(grounds.some((g) => g.includes('77/388/EEC'))).toBe(false);
  });

  it('drops the mismatched article combinations found by the legal review', () => {
    expect(grounds.some((g) => g.includes('чл.28 + чл.86'))).toBe(false);
    expect(grounds.some((g) => g.includes('чл.69'))).toBe(false);
    expect(grounds.some((g) => g.includes('чл.84 + чл.17'))).toBe(false);
    expect(grounds.some((g) => g.includes('ППЗДДС'))).toBe(false);
  });

  it('exports the export-of-goods ground on its own (чл. 28)', () => {
    expect(grounds).toContain('чл. 28 от ЗДДС');
  });

  it('always writes "чл." with a space before the article number', () => {
    for (const ground of grounds) {
      expect(ground).not.toMatch(/чл\.\d/);
    }
    expect(getCountryConfig('BG').defaultExemptionGround).toBe('чл. 113, ал. 9 от ЗДДС');
  });
});

describe('amountInWords (bg) — Cyrillic currency words only', () => {
  it('spells out ЕВРО and ЕВРОЦЕНТА, never the Latin EUR', () => {
    const words = amountInWords(550012);
    expect(words).toContain('ЕВРО');
    expect(words).toContain('ЕВРОЦЕНТА');
    expect(words).not.toContain('EUR');
    expect(words).not.toContain(' ЦЕНТА');
  });
});

describe('BG classic labels — gender agreement and wording fixes', () => {
  it('agrees the status with a feminine document noun (фактура, оферта)', () => {
    expect(bg.statusPaid('invoice')).toBe('Статус: ПЛАТЕНА');
    expect(bg.statusCancelled('invoice')).toBe('Статус: АНУЛИРАНА');
    expect(bg.statusPaid('quote')).toBe('Статус: ПЛАТЕНА');
  });

  it('agrees the status with a neuter document noun (известие)', () => {
    expect(bg.statusPaid('credit_note')).toBe('Статус: ПЛАТЕНО');
    expect(bg.statusCancelled('debit_note')).toBe('Статус: АНУЛИРАНО');
  });

  it('labels the recipient signature line "Получил:", not "Получател:"', () => {
    expect(bg.recipientSignaturePrefix('invoice')).toBe('Получил: ');
  });

  it('spells out the tax-event date row and the invoice column headers', () => {
    expect(bg.taxEventPrefix).toBe('Дата на данъчното събитие: ');
    expect(bg.colPrice).toBe('Ед. цена без ДДС');
    expect(bg.colTotal).toBe('Стойност');
  });
});

describe('BG rendered invoice — end-to-end wording', () => {
  it('prints the fixed labels together on one invoice', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ status: 'PAID' }),
      lineItems: buildFakeLineItems(),
      presentation,
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('Дата на данъчното събитие: ');
    expect(html).toContain('Ед. цена без ДДС');
    expect(html).toContain('Стойност');
    expect(html).toContain('Статус: ПЛАТЕНА');
    expect(html).toContain('Получил: ');
    expect(html).toContain('ЕВРО И');
    expect(html).toContain('ЕВРОЦЕНТА');
  });
});
