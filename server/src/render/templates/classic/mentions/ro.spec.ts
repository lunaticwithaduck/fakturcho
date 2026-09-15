import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from '../locale';
import {
  buildFakeDocument,
  buildFakeLineItems,
  buildFakeMixedLineItems,
} from '../testing/fake-document';
import { roMentions } from './ro';

const locale = resolveClassicLocale('ro', 'RO');

describe('roMentions', () => {
  it('adds no mentions for a plain domestic standard-rate invoice', () => {
    const document = buildFakeDocument({ issuerCountry: 'RO' });
    const lineItems = buildFakeLineItems();
    expect(roMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('adds the reverse-charge mention when a line carries vatCategory AE', () => {
    const document = buildFakeDocument({ issuerCountry: 'RO', vatAmount: 0, vatRateBp: 0 });
    const lineItems = buildFakeMixedLineItems();
    expect(roMentions({ document, lineItems, locale })).toEqual([
      'Taxare inversă conform art. 307 alin. (2) din Codul fiscal',
    ]);
  });

  it('does not duplicate the reverse-charge mention when every line is AE', () => {
    const document = buildFakeDocument({ issuerCountry: 'RO', vatAmount: 0, vatRateBp: 0 });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(roMentions({ document, lineItems, locale })).toEqual([
      'Taxare inversă conform art. 307 alin. (2) din Codul fiscal',
    ]);
  });

  it('adds no mention for an exempt (E) or intra-community (K) line', () => {
    const document = buildFakeDocument({ issuerCountry: 'RO', vatAmount: 0, vatRateBp: 0 });
    const lineItems = buildFakeLineItems({ vatCategory: 'E', vatRateBp: 0 });
    expect(roMentions({ document, lineItems, locale })).toEqual([]);
  });
});
