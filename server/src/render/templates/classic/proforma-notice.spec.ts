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

const EXPECTED: Record<ClassicLanguage, string> = {
  bg: 'Проформа фактурата не е данъчен документ.',
  en: 'This is not a VAT invoice.',
  de: 'Dies ist keine Rechnung im Sinne des UStG.',
  fr: 'Facture proforma – document sans valeur fiscale.',
  it: "Documento privo di valenza fiscale ai sensi dell'art. 21 D.P.R. 633/1972.",
  pl: 'Faktura pro forma nie jest fakturą VAT.',
  ro: 'Factura proformă nu este document fiscal.',
  es: 'Documento sin validez fiscal.',
};

describe('proforma prints the not-a-VAT-invoice notice under the totals', () => {
  for (const [language, expected] of Object.entries(EXPECTED)) {
    it(`prints it in ${language}`, () => {
      const html = renderClassicTemplateHtml({
        document: buildFakeDocument({ documentType: 'PROFORMA' }),
        lineItems: buildFakeLineItems(),
        presentation,
        isDraft: false,
        language: language as ClassicLanguage,
      });
      expect(html).toContain(`<div class="exemption">${expected}</div>`);
    });
  }

  it('does not print it on an invoice', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ documentType: 'INVOICE' }),
      lineItems: buildFakeLineItems(),
      presentation,
      isDraft: false,
      language: 'en',
    });
    expect(html).not.toContain('This is not a VAT invoice.');
  });
});
