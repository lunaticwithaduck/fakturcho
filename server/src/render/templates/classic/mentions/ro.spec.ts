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
      'Taxare inversă – art. 196 din Directiva 2006/112/CE',
    ]);
  });

  it('does not duplicate the reverse-charge mention when every line is AE', () => {
    const document = buildFakeDocument({ issuerCountry: 'RO', vatAmount: 0, vatRateBp: 0 });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(roMentions({ document, lineItems, locale })).toEqual([
      'Taxare inversă – art. 196 din Directiva 2006/112/CE',
    ]);
  });

  it('does not duplicate the mention when the exemption ground already states it', () => {
    const document = buildFakeDocument({
      issuerCountry: 'RO',
      vatAmount: 0,
      vatRateBp: 0,
      vatExemptionGround: 'Taxare inversă',
    });
    const lineItems = buildFakeMixedLineItems();
    expect(roMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('adds no mention for an exempt (E) or intra-community (K) line', () => {
    const document = buildFakeDocument({ issuerCountry: 'RO', vatAmount: 0, vatRateBp: 0 });
    const lineItems = buildFakeLineItems({ vatCategory: 'E', vatRateBp: 0 });
    expect(roMentions({ document, lineItems, locale })).toEqual([]);
  });
});

describe('roMentions — TVA la încasare', () => {
  it('adds the mention on an invoice when the issuer is on the cash VAT scheme', () => {
    const document = buildFakeDocument({
      issuerCountry: 'RO',
      documentType: 'INVOICE',
      issuerVatOnCashBasis: true,
    });
    const lineItems = buildFakeLineItems();
    expect(roMentions({ document, lineItems, locale })).toEqual(['TVA la încasare']);
  });

  it('adds the mention on a debit note but not on a quote or delivery note', () => {
    const lineItems = buildFakeLineItems();
    const debitNote = buildFakeDocument({
      issuerCountry: 'RO',
      documentType: 'DEBIT_NOTE',
      issuerVatOnCashBasis: true,
    });
    expect(roMentions({ document: debitNote, lineItems, locale })).toEqual(['TVA la încasare']);

    const quote = buildFakeDocument({
      issuerCountry: 'RO',
      documentType: 'QUOTE',
      issuerVatOnCashBasis: true,
    });
    expect(roMentions({ document: quote, lineItems, locale })).toEqual([]);
  });

  it('adds no mention when the issuer is not on the cash VAT scheme', () => {
    const document = buildFakeDocument({
      issuerCountry: 'RO',
      documentType: 'INVOICE',
      issuerVatOnCashBasis: false,
    });
    const lineItems = buildFakeLineItems();
    expect(roMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('adds no mention when a line is not taxable in Romania with VAT charged (art. 282 alin. (6))', () => {
    for (const vatCategory of ['AE', 'E', 'O', 'K', 'G']) {
      const document = buildFakeDocument({
        issuerCountry: 'RO',
        documentType: 'INVOICE',
        issuerVatOnCashBasis: true,
        vatAmount: 0,
        vatRateBp: 0,
      });
      const lineItems = buildFakeLineItems({ vatCategory, vatRateBp: 0 });
      expect(roMentions({ document, lineItems, locale })).not.toContain('TVA la încasare');
    }
  });

  it('adds no mention when the document already carries an exemption ground', () => {
    const document = buildFakeDocument({
      issuerCountry: 'RO',
      documentType: 'INVOICE',
      issuerVatOnCashBasis: true,
      vatExemptionGround: 'Taxare inversă',
    });
    const lineItems = buildFakeMixedLineItems();
    expect(roMentions({ document, lineItems, locale })).not.toContain('TVA la încasare');
  });
});
