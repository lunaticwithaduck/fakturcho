import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from '../locale';
import {
  buildFakeDocument,
  buildFakeLineItems,
  buildFakeMixedLineItems,
} from '../testing/fake-document';
import { deMentions } from './de';

describe('deMentions', () => {
  const locale = resolveClassicLocale('de', 'DE');

  it('adds no mentions for a plain domestic standard-rate line', () => {
    const document = buildFakeDocument({ vatExemptionGround: null });
    const lineItems = buildFakeLineItems({ vatCategory: 'S', vatRateBp: 1900 });
    expect(deMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('adds the § 13b UStG reverse-charge note when a line is AE', () => {
    const document = buildFakeDocument({ vatExemptionGround: null });
    const lineItems = buildFakeMixedLineItems();
    expect(deMentions({ document, lineItems, locale })).toEqual([
      'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG',
    ]);
  });

  it('adds the § 4 Nr. 1 Buchst. b / § 6a UStG note when a line is K', () => {
    const document = buildFakeDocument({ vatExemptionGround: null });
    const lineItems = buildFakeLineItems({ vatCategory: 'K', vatRateBp: 0 });
    expect(deMentions({ document, lineItems, locale })).toEqual([
      'Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG',
    ]);
  });

  it('does not duplicate the reverse-charge note when it is already the document ground', () => {
    const document = buildFakeDocument({
      vatExemptionGround: 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(deMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('uses the § 3a Abs. 2 UStG / Art. 196 note for a cross-border B2B service', () => {
    const document = buildFakeDocument({
      vatExemptionGround: null,
      issuerCountry: 'DE',
      recipientCountry: 'FR',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(deMentions({ document, lineItems, locale })).toEqual([
      'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)',
    ]);
  });

  it('does not duplicate the cross-border note when it is already the document ground', () => {
    const document = buildFakeDocument({
      vatExemptionGround:
        'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)',
      issuerCountry: 'DE',
      recipientCountry: 'FR',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(deMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('keeps the domestic § 13b note for a domestic reverse charge even when both countries are DE', () => {
    const document = buildFakeDocument({
      vatExemptionGround: null,
      issuerCountry: 'DE',
      recipientCountry: 'DE',
    });
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(deMentions({ document, lineItems, locale })).toEqual([
      'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG',
    ]);
  });
});
