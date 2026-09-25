import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDiscounts, buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const vatChargedPresentation: VatPresentation = {
  vatCharged: true,
  showExemptionLine: false,
  exemptionGround: null,
};

describe('credit_note prints every amount as negative', () => {
  const document = buildFakeDocument({
    documentType: 'CREDIT_NOTE',
    subtotal: 100000,
    discountTotal: 0,
    amount: 120000,
    vatRateBp: 2000,
    vatAmount: 20000,
  });

  it('negates quantity and line total but keeps the unit price positive', () => {
    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeLineItems({ quantity: '2', unitPrice: 50000, lineTotal: 100000 }),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });
    expect(html).toContain('<td>-2</td>');
    expect(html).toContain('<td>500.00</td>');
    expect(html).toContain('<td>-1,000.00</td>');
  });

  it('negates the taxable base, VAT and total, and labels the last row Total credited', () => {
    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeLineItems({ quantity: '1', unitPrice: 100000, lineTotal: 100000 }),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });
    expect(html).toContain('Net amount (excl. VAT):');
    expect(html).toContain('-€1,000.00');
    expect(html).toContain('VAT (20%):');
    expect(html).toContain('-€200.00');
    expect(html).toContain('-€1,200.00');
    expect(html).toContain('Total credited:');
    expect(html).not.toContain('Amount due:');
  });

  it('a positive discount row becomes positive again once negated twice', () => {
    const withDiscount = buildFakeDocument({
      documentType: 'CREDIT_NOTE',
      subtotal: 100000,
      discountTotal: 10000,
      amount: 108000,
      vatRateBp: 2000,
      vatAmount: 18000,
    });
    const html = renderClassicTemplateHtml({
      document: withDiscount,
      lineItems: buildFakeLineItems({ quantity: '1', unitPrice: 100000, lineTotal: 100000 }),
      discounts: buildFakeDiscounts({ percentBp: 1000, label: '' }),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });
    expect(html).toContain('Subtotal:');
    expect(html).toContain('-€1,000.00');
    expect(html).toContain('Discount (10%):');
    expect(html).toContain('€100.00');
  });
});

describe('quote drops the due row but keeps the total row', () => {
  it('prints Total but no Amount due', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ documentType: 'QUOTE' }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });
    expect(html).toContain('Total (incl. VAT):');
    expect(html).not.toContain('Amount due:');
  });
});

describe('a PAID status relabels the due row without changing the amount', () => {
  it('prints Amount paid with the same value as Total', () => {
    const document = buildFakeDocument({ status: 'PAID', amount: 550000 });
    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });
    expect(html).toContain('Amount paid:');
    expect(html).not.toContain('Amount due:');
    expect((html.match(/€5,500\.00/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
