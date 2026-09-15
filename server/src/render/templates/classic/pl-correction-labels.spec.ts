import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const vatChargedPresentation: VatPresentation = {
  vatCharged: true,
  showExemptionLine: false,
  exemptionGround: null,
};

// art. 106j ustawy o VAT: a correction of the invoiced amount is a faktura
// korygująca whether it raises or lowers it — a nota debetowa is not a VAT
// document, so both correction types must print the identical legal name.
describe('PL correction document names', () => {
  it('prints "Faktura korygująca" for both credit_note and debit_note', () => {
    const creditNote = renderClassicTemplateHtml({
      document: buildFakeDocument({ documentType: 'CREDIT_NOTE', number: 5 }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'pl',
    });
    const debitNote = renderClassicTemplateHtml({
      document: buildFakeDocument({ documentType: 'DEBIT_NOTE', number: 6 }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'pl',
    });

    expect(creditNote).toContain('Faktura korygująca # 0000000005');
    expect(debitNote).toContain('Faktura korygująca # 0000000006');
    expect(debitNote).not.toContain('Nota debetowa');
  });
});
