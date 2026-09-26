import type { LineItem } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildFakeDocument, buildFakeLineItems } from '../testing/fake-document';
import { plMentions } from './pl';

function withCategory(vatCategory: string): readonly LineItem[] {
  return buildFakeLineItems({ vatCategory, vatRateBp: 0 });
}

describe('plMentions', () => {
  it('adds no mentions for a standard-rate line', () => {
    const document = buildFakeDocument();
    const lineItems = buildFakeLineItems();
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([]);
  });

  it('adds the reverse-charge annotation when a line carries AE', () => {
    const document = buildFakeDocument();
    const lineItems = withCategory('AE');
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([
      'odwrotne obciążenie',
    ]);
  });

  it('adds the intra-community supply note when a line carries K', () => {
    const document = buildFakeDocument();
    const lineItems = withCategory('K');
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([
      'Wewnątrzwspólnotowa dostawa towarów – art. 42 ustawy o podatku od towarów i usług.',
    ]);
  });

  it('adds both annotations when lines carry AE and K', () => {
    const document = buildFakeDocument();
    const lineItems = [...withCategory('AE'), ...withCategory('K')] as readonly LineItem[];
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([
      'odwrotne obciążenie',
      'Wewnątrzwspólnotowa dostawa towarów – art. 42 ustawy o podatku od towarów i usług.',
    ]);
  });

  it('adds no mentions for an exempt (E) line — the exemption ground carries that instead', () => {
    const document = buildFakeDocument();
    const lineItems = withCategory('E');
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([]);
  });
});

describe('plMentions — split payment mechanism (MPP), art. 106e ust. 1 pkt 18a', () => {
  it('adds no MPP mention when no line is załącznik 15', () => {
    const document = buildFakeDocument({ amount: 10_000_000 });
    const lineItems = buildFakeLineItems();
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([]);
  });

  it('adds the MPP mention when a załącznik 15 line pushes the gross total over 15 000 zł', () => {
    const document = buildFakeDocument({ amount: 400_000, currency: 'EUR', exchangeRate: '5' });
    const lineItems = buildFakeLineItems({ splitPaymentAnnex15: true });
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([
      'mechanizm podzielonej płatności',
    ]);
  });

  it('adds no MPP mention when the załącznik 15 line stays under the 15 000 zł threshold', () => {
    const document = buildFakeDocument({ amount: 200_000, currency: 'EUR', exchangeRate: '5' });
    const lineItems = buildFakeLineItems({ splitPaymentAnnex15: true });
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([]);
  });

  it('adds no MPP mention on a non-tax document even with a flagged line over threshold', () => {
    const document = buildFakeDocument({
      documentType: 'DELIVERY_NOTE',
      amount: 400_000,
      currency: 'EUR',
      exchangeRate: '5',
    });
    const lineItems = buildFakeLineItems({ splitPaymentAnnex15: true });
    expect(plMentions({ document, lineItems, locale: {} as never })).toEqual([]);
  });

  it('evaluates a credit note against the corrected (post-correction) total', () => {
    const document = buildFakeDocument({
      documentType: 'CREDIT_NOTE',
      amount: 60_000,
      currency: 'EUR',
      exchangeRate: '5',
    });
    const lineItems = buildFakeLineItems({ splitPaymentAnnex15: true });
    // Original 17 000 zł corrected down by 3 000 zł to 14 000 zł — under threshold.
    expect(
      plMentions({ document, lineItems, locale: {} as never, originalDocumentAmount: 340_000 }),
    ).toEqual([]);
  });
});
