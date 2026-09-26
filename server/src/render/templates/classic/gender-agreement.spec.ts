import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { buildSignatureRow } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const vatChargedPresentation: VatPresentation = {
  vatCharged: true,
  showExemptionLine: false,
  exemptionGround: null,
};

function renderStatus(
  language: 'it' | 'fr' | 'ro' | 'pl',
  documentType: string,
  status: 'SENT' | 'PAID' | 'CANCELLED',
): string {
  return renderClassicTemplateHtml({
    document: buildFakeDocument({ documentType, status, number: 1 }),
    lineItems: buildFakeLineItems(),
    presentation: vatChargedPresentation,
    isDraft: false,
    language,
  });
}

// il preventivo / un devis are masculine, as is the delivery note in
// IT/FR/PL; RO's neuter "aviz" takes the masculine singular form.
describe('gender agreement per document type', () => {
  it('IT: agrees with il preventivo (masculine) on a quote and la fattura (feminine) elsewhere', () => {
    const invoice = renderStatus('it', 'INVOICE', 'PAID');
    expect(invoice).toContain('Stato: PAGATA');
    const quote = renderStatus('it', 'QUOTE', 'PAID');
    expect(quote).toContain('Stato: PAGATO');
    expect(quote).toContain('Valido fino al:');
    expect(quote).not.toContain('Valida fino al');

    const cancelledInvoice = renderStatus('it', 'INVOICE', 'CANCELLED');
    expect(cancelledInvoice).toContain('Stato: ANNULLATA');
    const cancelledQuote = renderStatus('it', 'QUOTE', 'CANCELLED');
    expect(cancelledQuote).toContain('Stato: ANNULLATO');
  });

  it('FR: agrees with un devis/un avoir (masculine) and la facture (feminine)', () => {
    const invoice = renderStatus('fr', 'INVOICE', 'PAID');
    expect(invoice).toContain('Statut : PAYÉE');
    const creditNote = renderStatus('fr', 'CREDIT_NOTE', 'PAID');
    expect(creditNote).toContain('Statut : PAYÉ');
    const quote = renderStatus('fr', 'QUOTE', 'CANCELLED');
    expect(quote).toContain('Statut : ANNULÉ');
    const debitNote = renderStatus('fr', 'DEBIT_NOTE', 'CANCELLED');
    expect(debitNote).toContain('Statut : ANNULÉE');
  });

  it('RO: ofertă is feminine, the aviz of a delivery note takes the masculine form', () => {
    const invoice = renderStatus('ro', 'INVOICE', 'PAID');
    expect(invoice).toContain('Status: ACHITATĂ');
    const quote = renderStatus('ro', 'QUOTE', 'PAID');
    expect(quote).toContain('Status: ACHITATĂ');
    expect(quote).toContain('Valabilă până la:');
    const deliveryNote = renderStatus('ro', 'DELIVERY_NOTE', 'CANCELLED');
    expect(deliveryNote).toContain('Status: ANULAT<');
    expect(deliveryNote).toContain('Întocmit de:');
  });

  it('delivery notes take the masculine form in IT, FR and PL', () => {
    expect(renderStatus('it', 'DELIVERY_NOTE', 'CANCELLED')).toContain('Stato: ANNULLATO');
    expect(renderStatus('fr', 'DELIVERY_NOTE', 'CANCELLED')).toContain('Statut : ANNULÉ<');
    expect(renderStatus('pl', 'DELIVERY_NOTE', 'CANCELLED')).toContain('Status: ANULOWANY');
    expect(renderStatus('pl', 'INVOICE', 'CANCELLED')).toContain('Status: ANULOWANA');
  });

  it('IT: buildSignatureRow agrees with the document type (invoice feminine, quote masculine)', () => {
    const locale = resolveClassicLocale('it', 'IT');
    const document = buildFakeDocument({ preparedBy: 'Mario Rossi' });

    expect(buildSignatureRow(document, 'invoice', locale)).toContain('Emessa da: Mario Rossi');
    expect(buildSignatureRow(document, 'quote', locale)).toContain('Emesso da: Mario Rossi');
  });
});
