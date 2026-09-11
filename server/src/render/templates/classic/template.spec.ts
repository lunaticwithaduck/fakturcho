import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { resolveVatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import {
  buildFakeDocument,
  buildFakeLineItems,
  buildFakeMixedLineItems,
} from './testing/fake-document';

const vatChargedPresentation: VatPresentation = {
  vatCharged: true,
  showExemptionLine: false,
  exemptionGround: null,
};

describe('renderClassicTemplateHtml', () => {
  it('renders the Bulgarian classic template unchanged', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument(),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      dualDisplayActive: true,
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('<html lang="bg">');
    expect(html).toContain('Получател:');
    expect(html).toContain('ЕИК: 987654321');
    expect(html).toContain('ДДС №: BG987654321');
    expect(html).toContain('Дата на издаване: 02.08.2026');
    expect(html).toContain('Данъчно събитие: 02.08.2026');
    expect(html).not.toContain('Валидно до');
    expect(html).toContain('Фактура # 0000000001 (Оригинал)');
    expect(html).toContain('Наименование');
    expect(html).toContain('Количество');
    expect(html).toContain('Цена');
    expect(html).toContain('Общо');
    expect(html).toContain('ПЕТ ХИЛЯДИ И ПЕТСТОТИН EUR И 00 ЦЕНТА');
    expect(html).toContain('Данъчна основа:');
    expect(html).toContain('ДДС (20%):');
    expect(html).toContain('Общо:');
    expect(html).toContain('Сума за плащане:');
    expect(html).toContain('лв.');
    expect(html).toContain('ЕИК: 123456789');
    expect(html).toContain('МОЛ: Мария Петрова');
    expect(html).toContain('Телефон: +359 888 123 456');
    expect(html).toContain('BIC: BNBGBGSD');
    expect(html).toContain('class="signature-row"');
    expect(html).toContain('Съставил: Иван Иванов');
  });

  it('renders an English-resolved document without the Bulgarian-only blocks', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument(),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      dualDisplayActive: true,
      isDraft: false,
      language: 'en',
    });

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Recipient:');
    expect(html).toContain('Company registration no.: 987654321');
    expect(html).toContain('VAT no.: BG987654321');
    expect(html).toContain('Issue date: 02/08/2026');
    expect(html).toContain('Tax event: 02/08/2026');
    expect(html).toContain('Invoice # 0000000001');
    expect(html).not.toContain('(Original)');
    expect(html).not.toContain('Оригинал');
    expect(html).toContain('Description');
    expect(html).toContain('Quantity');
    expect(html).toContain('Price');
    expect(html).toContain('Total');
    expect(html).not.toContain('class="amount-words"');
    expect(html).toContain('Taxable amount:');
    expect(html).toContain('VAT (20%):');
    expect(html).toContain('Amount due:');
    expect(html).not.toContain('лв.');
    expect(html).not.toContain('Representative:');
    expect(html).not.toContain('МОЛ');
    expect(html).not.toContain('class="signature-row"');
  });

  it('marks an English draft without a document number as Draft', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ number: null }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      dualDisplayActive: false,
      isDraft: true,
      language: 'en',
    });

    expect(html).toContain('Invoice # Draft');
    expect(html).toContain('DRAFT');
    expect(html).toContain('NOT LEGALLY VALID');
  });

  it('formats a fractional quantity with the locale decimal separator', () => {
    const bgHtml = renderClassicTemplateHtml({
      document: buildFakeDocument(),
      lineItems: buildFakeLineItems({ quantity: '2.5' }),
      presentation: vatChargedPresentation,
      dualDisplayActive: false,
      isDraft: false,
      language: 'bg',
    });
    expect(bgHtml).toContain('<td>2,5</td>');

    const enHtml = renderClassicTemplateHtml({
      document: buildFakeDocument(),
      lineItems: buildFakeLineItems({ quantity: '2.5' }),
      presentation: vatChargedPresentation,
      dualDisplayActive: false,
      isDraft: false,
      language: 'en',
    });
    expect(enHtml).toContain('<td>2.5</td>');
  });

  it('marks a quote as Валидно до in Bulgarian and without a tax event line', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ documentType: 'QUOTE' }),
      lineItems: buildFakeLineItems(),
      presentation: { vatCharged: true, showExemptionLine: false, exemptionGround: null },
      dualDisplayActive: false,
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('Валидно до: 02.09.2026');
    expect(html).not.toContain('Данъчно събитие');
    expect(html).not.toContain('(Оригинал)');
  });

  it('renders a per-category VAT breakdown for a mixed reverse-charge + standard-rate document (bg)', () => {
    const document = buildFakeDocument({
      subtotal: 100000,
      discountTotal: 0,
      amount: 110000,
      vatRateBp: 2000,
      vatAmount: 10000,
      vatExemptionGround: 'чл.21 от ЗДДС',
    });
    const presentation = resolveVatPresentation({
      vatRegistered: true,
      vatRateBp: document.vatRateBp,
      vatExemptionGround: document.vatExemptionGround,
      documentType: 'invoice',
    });

    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeMixedLineItems(),
      presentation,
      dualDisplayActive: false,
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('Данъчна основа:');
    expect(html).toContain('500,00 €');
    expect(html).toContain('ДДС (20%):');
    expect(html).toContain('100,00 €');
    expect(html).toContain('Основание за неначисляване на ДДС: чл.21 от ЗДДС');
    expect(html).not.toContain('ДДС (0%):');
    expect((html.match(/Данъчна основа:/g) ?? []).length).toBe(1);
    expect(html).toContain('1 100,00 €');
  });

  it('renders a per-category VAT breakdown for a mixed reverse-charge + standard-rate document (en)', () => {
    const document = buildFakeDocument({
      subtotal: 100000,
      discountTotal: 0,
      amount: 110000,
      vatRateBp: 2000,
      vatAmount: 10000,
      vatExemptionGround: 'чл.21 от ЗДДС',
    });
    const presentation = resolveVatPresentation({
      vatRegistered: true,
      vatRateBp: document.vatRateBp,
      vatExemptionGround: document.vatExemptionGround,
      documentType: 'invoice',
    });

    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeMixedLineItems(),
      presentation,
      dualDisplayActive: false,
      isDraft: false,
      language: 'en',
    });

    expect(html).toContain('Taxable amount:');
    expect(html).toContain('500.00 €');
    expect(html).toContain('VAT (20%):');
    expect(html).toContain('100.00 €');
    expect(html).toContain('VAT exemption ground: чл.21 от ЗДДС');
    expect(html).not.toContain('VAT (0%):');
    expect((html.match(/Taxable amount:/g) ?? []).length).toBe(1);
    expect(html).toContain('1,100.00 €');
  });
});
