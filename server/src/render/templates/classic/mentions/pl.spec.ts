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
