import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import type { ClassicLanguage } from './labels';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const presentation: VatPresentation = {
  vatCharged: true,
  showExemptionLine: false,
  exemptionGround: null,
};

const original = {
  number: 41,
  numberPrefix: null,
  numberSuffix: null,
  issuedAt: new Date('2026-07-15'),
};

const EXPECTED: Record<ClassicLanguage, string> = {
  bg: 'Към фактура № 0000000041 от 15.07.2026',
  en: 'Relates to invoice no. 0000000041 of 15/07/2026',
  de: 'Zur Rechnung Nr. 0000000041 vom 15.07.2026',
  fr: 'Facture d&#39;origine : n° 0000000041 du 15/07/2026',
  it: 'Riferita alla fattura n. 0000000041 del 15/07/2026',
  pl: 'Dotyczy faktury nr 0000000041 z dnia 15.07.2026',
  ro: 'Referitoare la factura nr. 0000000041 din 15.07.2026',
  es: 'Factura rectificada: n.º 0000000041 de 15/07/2026',
};

function render(language: ClassicLanguage, documentType: string, withOriginal = true) {
  return renderClassicTemplateHtml({
    document: buildFakeDocument({ documentType, number: 42 }),
    lineItems: buildFakeLineItems(),
    presentation,
    isDraft: false,
    language,
    originalDocument: withOriginal ? original : null,
  });
}

describe('correction reference', () => {
  for (const [language, expected] of Object.entries(EXPECTED)) {
    it(`names the corrected invoice on credit and debit notes (${language})`, () => {
      expect(render(language as ClassicLanguage, 'CREDIT_NOTE')).toContain(expected);
      expect(render(language as ClassicLanguage, 'DEBIT_NOTE')).toContain(expected);
    });
  }

  it('prints nothing on an invoice or without an original', () => {
    expect(render('en', 'INVOICE')).not.toContain('Relates to invoice');
    expect(render('en', 'CREDIT_NOTE', false)).not.toContain('Relates to invoice');
  });

  it('prints the issuer VAT number in the issuer block', () => {
    const html = render('de', 'INVOICE', false);
    const issuerBlock = html.slice(html.indexOf('class="issuer-block"'));
    expect(issuerBlock).toContain('USt-IdNr.: BG123456789');
  });
});
