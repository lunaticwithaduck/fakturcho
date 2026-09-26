import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from '../locale';
import { buildFakeDocument, buildFakeLineItems } from '../testing/fake-document';
import { atMentions } from './at';

describe('atMentions', () => {
  const locale = resolveClassicLocale('de', 'AT');

  it('adds no mentions for a plain domestic standard-rate line', () => {
    const document = buildFakeDocument({ vatExemptionGround: null });
    const lineItems = buildFakeLineItems({ vatCategory: 'S', vatRateBp: 2000 });
    expect(atMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('adds the generic § 19 UStG 1994 note for a domestic reverse charge with no specific ground selected', () => {
    const document = buildFakeDocument({
      vatExemptionGround: null,
      issuerCountry: 'AT',
      recipientCountry: 'AT',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(atMentions({ document, lineItems, locale })).toEqual([
      'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 UStG 1994 (Reverse Charge).',
    ]);
  });

  it('does not duplicate the note when the document already carries the specific § 19 Abs. 1a construction ground', () => {
    const document = buildFakeDocument({
      vatExemptionGround:
        'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1a UStG 1994 (Bauleistungen).',
      issuerCountry: 'AT',
      recipientCountry: 'AT',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(atMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('uses the § 3a Abs. 6 / Art. 196 note for a cross-border EU B2B service', () => {
    const document = buildFakeDocument({
      vatExemptionGround: null,
      issuerCountry: 'AT',
      recipientCountry: 'DE',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(atMentions({ document, lineItems, locale })).toEqual([
      'Übergang der Steuerschuld auf den Leistungsempfänger (Reverse Charge) – Leistungsort gemäß § 3a Abs. 6 UStG 1994 im Mitgliedstaat des Leistungsempfängers, Steuerschuldnerschaft des Leistungsempfängers gemäß Art. 196 MwStSystRL.',
    ]);
  });

  it('does not duplicate the cross-border note when it is already the document ground', () => {
    const document = buildFakeDocument({
      vatExemptionGround:
        'Übergang der Steuerschuld auf den Leistungsempfänger (Reverse Charge) – Leistungsort gemäß § 3a Abs. 6 UStG 1994 im Mitgliedstaat des Leistungsempfängers, Steuerschuldnerschaft des Leistungsempfängers gemäß Art. 196 MwStSystRL.',
      issuerCountry: 'AT',
      recipientCountry: 'DE',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(atMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('adds the Art. 6/7 BMR intra-Community supply note for a K line', () => {
    const document = buildFakeDocument({
      vatExemptionGround: null,
      issuerCountry: 'AT',
      recipientCountry: 'DE',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'K', vatRateBp: 0 });
    expect(atMentions({ document, lineItems, locale })).toEqual([
      'Steuerfreie innergemeinschaftliche Lieferung gemäß Art. 6 Abs. 1 iVm Art. 7 UStG 1994 (Binnenmarktregelung).',
    ]);
  });

  it('does not duplicate the intra-Community note when it is already the document ground', () => {
    const document = buildFakeDocument({
      vatExemptionGround:
        'Steuerfreie innergemeinschaftliche Lieferung gemäß Art. 6 Abs. 1 iVm Art. 7 UStG 1994 (Binnenmarktregelung).',
      issuerCountry: 'AT',
      recipientCountry: 'DE',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'K', vatRateBp: 0 });
    expect(atMentions({ document, lineItems, locale })).toEqual([]);
  });
});
