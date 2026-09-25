import { describe, expect, it } from 'vitest';
import { resolveVatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const NOT_SUBJECT_EU_B2B =
  'Operación no sujeta a IVA (artículo 69.Uno.1º de la Ley 37/1992 del IVA)';
const REVERSE_CHARGE_DOMESTIC =
  'Inversión del sujeto pasivo, artículo 84.Uno.2º de la Ley 37/1992 del IVA';
const REVERSE_CHARGE_CROSS_BORDER =
  'Inversión del sujeto pasivo (artículo 196 de la Directiva 2006/112/CE)';

function renderEsInvoice(overrides: Record<string, unknown>) {
  const document = buildFakeDocument({
    documentType: 'INVOICE',
    issuerCountry: 'ES',
    ...overrides,
  });
  return renderClassicTemplateHtml({
    document,
    lineItems: buildFakeLineItems({ vatCategory: overrides.vatCategory ?? 'S' }),
    presentation: resolveVatPresentation({
      vatRegistered: true,
      vatRateBp: (overrides.vatRateBp as number) ?? 2100,
      vatExemptionGround: (overrides.vatExemptionGround as string | null) ?? null,
      documentType: 'invoice',
    }),
    isDraft: false,
    language: 'es',
    issuerCountry: 'ES',
  });
}

describe('ES legal text (art. 69.Uno.1º / 84.Uno.2º / 196 Directiva)', () => {
  it('prints the not-subject ground for a cross-border EU B2B service without the exemption prefix', () => {
    const html = renderEsInvoice({
      recipientCountry: 'DE',
      vatCategory: 'AE',
      vatRateBp: 0,
      vatExemptionGround: NOT_SUBJECT_EU_B2B,
    });
    expect(html).toContain(`<div class="exemption">${NOT_SUBJECT_EU_B2B}</div>`);
    expect(html).not.toContain(`Operación exenta de IVA según el ${NOT_SUBJECT_EU_B2B}`);
  });

  it('cites the EU Directive reverse charge for the cross-border B2B service', () => {
    const html = renderEsInvoice({
      recipientCountry: 'DE',
      vatCategory: 'AE',
      vatRateBp: 0,
      vatExemptionGround: NOT_SUBJECT_EU_B2B,
    });
    expect(html).toContain(REVERSE_CHARGE_CROSS_BORDER);
    expect(html).not.toContain(REVERSE_CHARGE_DOMESTIC);
  });

  it('cites the domestic reverse charge when the client is also Spanish', () => {
    const html = renderEsInvoice({ recipientCountry: 'ES', vatCategory: 'AE', vatRateBp: 0 });
    expect(html).toContain(REVERSE_CHARGE_DOMESTIC);
    expect(html).not.toContain(REVERSE_CHARGE_CROSS_BORDER);
  });

  it('keeps the exemption prefix for a genuine exemption ground', () => {
    const ground = 'artículo 20.Uno.9º de la Ley 37/1992 del IVA';
    const html = renderEsInvoice({ vatCategory: 'E', vatRateBp: 0, vatExemptionGround: ground });
    expect(html).toContain(`Operación exenta de IVA según el ${ground}`);
  });

  it('numbers the invoice with the Spanish ordinal sign, not "#"', () => {
    const html = renderEsInvoice({ number: 42 });
    expect(html).toContain('Factura n.º 0000000042');
    expect(html).not.toContain('Factura #');
  });

  it('labels the price column as unit price', () => {
    const html = renderEsInvoice({});
    expect(html).toContain('Precio unitario');
  });
});
