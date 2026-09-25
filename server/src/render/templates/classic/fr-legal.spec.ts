import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const vatChargedPresentation: VatPresentation = {
  vatCharged: true,
  showExemptionLine: false,
  exemptionGround: null,
};

const AUTOLIQUIDATION =
  'Autoliquidation – TVA due par le preneur, art. 259-1 du CGI et art. 196 de la directive 2006/112/CE';
const FRANCHISE_GROUND = 'TVA non applicable, art. 293 B du CGI';
const INTRA_EU_GROUND = 'Exonération de TVA, article 262 ter I du CGI';

function renderFr(
  overrides: Parameters<typeof buildFakeDocument>[0] = {},
  presentation = vatChargedPresentation,
) {
  return renderClassicTemplateHtml({
    document: buildFakeDocument({ issuerCountry: 'FR', ...overrides }),
    lineItems: buildFakeLineItems(),
    presentation,
    isDraft: false,
    language: 'fr',
    issuerCountry: 'FR',
  });
}

describe('FR line-item columns state the price is before tax', () => {
  it('labels the unit-price and line-total columns HT', () => {
    const html = renderFr();
    expect(html).toContain('<th>Prix unitaire HT</th>');
    expect(html).toContain('<th>Total HT</th>');
  });
});

describe('FR VAT rate uses a non-breaking space before the percent sign', () => {
  it('prints TVA (20 %) :', () => {
    const html = renderFr();
    expect(html).toContain('TVA (20 %) :');
  });
});

describe('FR debit note is named a rectifying invoice, not a débours note', () => {
  it('titles it Facture rectificative', () => {
    const html = renderFr({ documentType: 'DEBIT_NOTE' });
    expect(html).toContain('Facture rectificative');
    expect(html).not.toContain('Note de débit');
  });
});

describe('FR VAT notes print without the exemption prefix', () => {
  it('prints the reverse-charge ground bare', () => {
    const html = renderFr(
      {},
      { vatCharged: false, showExemptionLine: true, exemptionGround: AUTOLIQUIDATION },
    );
    expect(html).toContain(`<div class="exemption">${AUTOLIQUIDATION}</div>`);
    expect(html).not.toContain(`exonération de TVA : ${AUTOLIQUIDATION}`);
  });

  it('prints the small-business franchise ground bare, without doubling "TVA"', () => {
    const html = renderFr(
      {},
      { vatCharged: false, showExemptionLine: true, exemptionGround: FRANCHISE_GROUND },
    );
    expect(html).toContain(`<div class="exemption">${FRANCHISE_GROUND}</div>`);
    expect(html).not.toContain("Motif d'exonération de TVA :");
  });

  it('prints the intra-EU exemption ground once, without repeating the exemption prefix', () => {
    const html = renderFr(
      {},
      { vatCharged: false, showExemptionLine: true, exemptionGround: INTRA_EU_GROUND },
    );
    expect(html).toContain(`<div class="exemption">${INTRA_EU_GROUND}</div>`);
    expect(html).not.toContain("Motif d'exonération de TVA :");
  });
});

describe('FR credit note carries no payment-terms boilerplate', () => {
  it('omits due date, escompte, penalty rate and the collection fee', () => {
    const html = renderFr({ documentType: 'CREDIT_NOTE', dueAt: new Date('2026-09-15') });
    expect(html).not.toContain("Date d'échéance");
    expect(html).not.toContain('Escompte pour paiement anticipé');
    expect(html).not.toContain('recouvrement');
  });
});
