import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from '../locale';
import { buildFakeDocument, buildFakeLineItems } from '../testing/fake-document';
import { esMentions } from './es';

const locale = resolveClassicLocale('es', 'ES');

describe('esMentions', () => {
  it('adds nothing for an ordinary standard-rate line', () => {
    const document = buildFakeDocument();
    const lineItems = buildFakeLineItems({ vatCategory: 'S' });
    expect(esMentions({ document, lineItems, locale })).toEqual([]);
  });

  it('flags reverse charge when a line carries AE', () => {
    const document = buildFakeDocument();
    const lineItems = buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 });
    expect(esMentions({ document, lineItems, locale })).toEqual([
      'Inversión del sujeto pasivo, artículo 84.Uno.2º de la Ley 37/1992 del IVA',
    ]);
  });

  it('flags an intra-community supply when a line carries K', () => {
    const document = buildFakeDocument();
    const lineItems = buildFakeLineItems({ vatCategory: 'K', vatRateBp: 0 });
    expect(esMentions({ document, lineItems, locale })).toEqual([
      'Entrega intracomunitaria exenta, artículo 25 de la Ley 37/1992 del IVA',
    ]);
  });

  it('flags an export when a line carries G', () => {
    const document = buildFakeDocument();
    const lineItems = buildFakeLineItems({ vatCategory: 'G', vatRateBp: 0 });
    expect(esMentions({ document, lineItems, locale })).toEqual([
      'Exportación exenta, artículo 21 de la Ley 37/1992 del IVA',
    ]);
  });

  it('combines mentions when different lines carry different categories', () => {
    const document = buildFakeDocument();
    const lineItems = [
      ...buildFakeLineItems({ id: 'li_ae', vatCategory: 'AE', vatRateBp: 0 }),
      ...buildFakeLineItems({ id: 'li_k', vatCategory: 'K', vatRateBp: 0 }),
    ];
    expect(esMentions({ document, lineItems, locale })).toEqual([
      'Inversión del sujeto pasivo, artículo 84.Uno.2º de la Ley 37/1992 del IVA',
      'Entrega intracomunitaria exenta, artículo 25 de la Ley 37/1992 del IVA',
    ]);
  });
});
