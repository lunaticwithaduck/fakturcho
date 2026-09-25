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

const EXPECTED_REASON: Record<ClassicLanguage, string> = {
  bg: 'Основание за издаване: Върната стока',
  en: 'Reason: Returned goods',
  de: 'Grund der Korrektur: Rückgabe der Ware',
  fr: 'Motif : Retour de marchandise',
  it: 'Causale: Reso della merce',
  pl: 'Przyczyna korekty: Zwrot towaru',
  ro: 'Motivul corecției: Returnarea mărfii',
  es: 'Motivo de la rectificación: Devolución de mercancía',
};

function render(
  language: ClassicLanguage,
  documentType: string,
  withOriginal = true,
  correctionReason: string | null = null,
) {
  return renderClassicTemplateHtml({
    document: buildFakeDocument({ documentType, number: 42, correctionReason }),
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

  const REASON_TEXT: Record<ClassicLanguage, string> = {
    bg: 'Върната стока',
    en: 'Returned goods',
    de: 'Rückgabe der Ware',
    fr: 'Retour de marchandise',
    it: 'Reso della merce',
    pl: 'Zwrot towaru',
    ro: 'Returnarea mărfii',
    es: 'Devolución de mercancía',
  };

  for (const [language, expected] of Object.entries(EXPECTED_REASON)) {
    it(`prints the correction reason under the correction reference (${language})`, () => {
      const reason = REASON_TEXT[language as ClassicLanguage];
      const creditHtml = render(language as ClassicLanguage, 'CREDIT_NOTE', true, reason);
      const debitHtml = render(language as ClassicLanguage, 'DEBIT_NOTE', true, reason);
      expect(creditHtml).toContain(expected);
      expect(debitHtml).toContain(expected);
      expect(creditHtml.indexOf('correction-reference')).toBeLessThan(
        creditHtml.indexOf('correction-reason'),
      );
    });
  }

  it('prints no reason line when there is no correction reason', () => {
    const html = render('en', 'CREDIT_NOTE', true, null);
    expect(html).not.toContain('<div class="correction-reason">');
  });

  it('escapes an untrusted reason before printing it', () => {
    const html = render('en', 'CREDIT_NOTE', true, '<script>alert(1)</script>');
    expect(html).toContain('Reason: &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('prints the issuer VAT number in the issuer block', () => {
    const html = render('de', 'INVOICE', false);
    const issuerBlock = html.slice(html.indexOf('class="issuer-block"'));
    expect(issuerBlock).toContain('USt-IdNr.: BG123456789');
  });
});
