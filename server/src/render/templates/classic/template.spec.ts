import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { resolveVatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import {
  buildFakeDiscounts,
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
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('<html lang="bg">');
    expect(html).toContain('Получател:');
    expect(html).toContain('ЕИК: 987654321');
    expect(html).toContain('ДДС №: BG987654321');
    expect(html).toContain('Дата на издаване: 02.08.2026');
    expect(html).toContain('Дата на данъчното събитие: 02.08.2026');
    expect(html).not.toContain('Валидно до');
    expect(html).toContain('Фактура № 0000000001 (Оригинал)');
    expect(html).toContain('Наименование');
    expect(html).toContain('Количество');
    expect(html).toContain('Ед. цена без ДДС');
    expect(html).toContain('Стойност');
    expect(html).toContain('ПЕТ ХИЛЯДИ И ПЕТСТОТИН ЕВРО И 00 ЕВРОЦЕНТА');
    expect(html).toContain('Данъчна основа:');
    expect(html).toContain('ДДС (20%):');
    expect(html).toContain('Общо:');
    expect(html).toContain('Сума за плащане:');
    expect(html).not.toContain('лв.');
    expect(html).toContain('ЕИК: 123456789');
    expect(html).toContain('МОЛ: Мария Петрова');
    expect(html).toContain('Телефон: +359 888 123 456');
    expect(html).toContain('BIC: BNBGBGSD');
    expect(html).toContain('class="signature-row"');
    expect(html).toContain('Съставил: Иван Иванов');
  });

  it('renders an English-resolved document without the Bulgarian-only blocks', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ taxEventAt: new Date('2026-08-01') }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Recipient:');
    expect(html).toContain('Company registration no.: 987654321');
    expect(html).toContain('VAT no.: BG987654321');
    expect(html).toContain('Issue date: 02/08/2026');
    expect(html).toContain('Date of supply: 01/08/2026');
    expect(html).toContain('Invoice no. 0000000001');
    expect(html).not.toContain('(Original)');
    expect(html).not.toContain('Оригинал');
    expect(html).toContain('Description');
    expect(html).toContain('Quantity');
    expect(html).toContain('Price');
    expect(html).toContain('Total');
    expect(html).not.toContain('class="amount-words"');
    expect(html).toContain('Net amount (excl. VAT):');
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
      isDraft: true,
      language: 'en',
    });

    expect(html).toContain('Invoice (draft)');
    expect(html).toContain('DRAFT');
    expect(html).toContain('NOT LEGALLY VALID');
  });

  it('confines the draft watermark to the pre-footer area, never the mentions/issuer/bank footer', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ number: null }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: true,
      language: 'en',
    });

    const watermarkAreaIndex = html.indexOf('class="watermark-area is-draft"');
    const watermarkIndex = html.indexOf('class="watermark"');
    const issuerBlockIndex = html.indexOf('class="issuer-block"');
    expect(watermarkAreaIndex).toBeGreaterThan(-1);
    expect(watermarkIndex).toBeGreaterThan(watermarkAreaIndex);
    expect(issuerBlockIndex).toBeGreaterThan(watermarkIndex);
  });

  it('reserves the watermark min-height only on a draft, so an issued document has no blank band', () => {
    const issued = renderClassicTemplateHtml({
      document: buildFakeDocument({ number: 1 }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });
    expect(issued).toContain('class="watermark-area"');
    expect(issued).not.toContain('watermark-area is-draft');
    expect(issued).toContain('.watermark-area.is-draft');
    expect(issued).not.toMatch(/\.watermark-area\s*\{[^}]*min-height/);
  });

  it('threads a resolved (not-yet-snapshotted) issuer country into a draft: DE Steuernummer row and §19 line', () => {
    const document = buildFakeDocument({
      status: 'DRAFT',
      number: null,
      issuerCountry: null,
      issuerVatRegistered: false,
      issuerVatNumber: null,
      issuerIdentifiers: { steuernummer: '21/815/08150' },
      vatExemptionGround: 'Steuerbefreiung für Kleinunternehmer gemäß § 19 Abs. 1 UStG.',
    });
    const presentation = resolveVatPresentation({
      vatRegistered: false,
      vatRateBp: 0,
      vatExemptionGround: document.vatExemptionGround,
      documentType: 'invoice',
    });

    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeLineItems(),
      presentation,
      isDraft: true,
      language: 'de',
      issuerCountry: 'DE',
    });

    expect(html).toContain('Steuernummer: 21/815/08150');
    expect(html).toContain('Steuerbefreiung für Kleinunternehmer gemäß § 19 Abs. 1 UStG.');
  });

  it('formats a fractional quantity with the locale decimal separator', () => {
    const bgHtml = renderClassicTemplateHtml({
      document: buildFakeDocument(),
      lineItems: buildFakeLineItems({ quantity: '2.5' }),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'bg',
    });
    expect(bgHtml).toContain('<td>2,5</td>');

    const enHtml = renderClassicTemplateHtml({
      document: buildFakeDocument(),
      lineItems: buildFakeLineItems({ quantity: '2.5' }),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });
    expect(enHtml).toContain('<td>2.5</td>');
  });

  it('marks a quote as Валидна до in Bulgarian and without a tax event line', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ documentType: 'QUOTE' }),
      lineItems: buildFakeLineItems(),
      presentation: { vatCharged: true, showExemptionLine: false, exemptionGround: null },
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('Валидна до: 02.09.2026');
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
      vatExemptionGround: 'Обратно начисляване – чл. 21, ал. 2 от ЗДДС',
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
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('Данъчна основа:');
    expect(html).toContain('Данъчна основа (20%):');
    expect(html).toContain('500,00 €');
    expect(html).toContain('ДДС (20%):');
    expect(html).toContain('100,00 €');
    expect(html).toContain(
      '<div class="exemption">Обратно начисляване – чл. 21, ал. 2 от ЗДДС</div>',
    );
    expect(html).not.toContain('ДДС (0%):');
    expect((html.match(/Данъчна основа:/g) ?? []).length).toBe(1);
    expect((html.match(/Данъчна основа \(20%\):/g) ?? []).length).toBe(1);
    expect(html).toContain('1 100,00 €');
  });

  it('renders a per-category VAT breakdown for a mixed reverse-charge + standard-rate document (en)', () => {
    const document = buildFakeDocument({
      subtotal: 100000,
      discountTotal: 0,
      amount: 110000,
      vatRateBp: 2000,
      vatAmount: 10000,
      vatExemptionGround: 'Обратно начисляване – чл. 21, ал. 2 от ЗДДС',
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
      isDraft: false,
      language: 'en',
    });

    expect(html).toContain('Net amount (excl. VAT):');
    expect(html).toContain('Net amount at 20%:');
    expect(html).toContain('€500.00');
    expect(html).toContain('VAT (20%):');
    expect(html).toContain('€100.00');
    expect(html).toContain('VAT exemption ground: Обратно начисляване – чл. 21, ал. 2 от ЗДДС');
    expect(html).not.toContain('VAT (0%):');
    expect((html.match(/Net amount \(excl\. VAT\):/g) ?? []).length).toBe(1);
    expect((html.match(/Net amount at 20%:/g) ?? []).length).toBe(1);
    expect(html).toContain('€1,100.00');
  });

  it('renders identical output when discountTotal is zero regardless of stored discounts', () => {
    const withoutDiscounts = renderClassicTemplateHtml({
      document: buildFakeDocument(),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'bg',
    });
    const withStoredDiscounts = renderClassicTemplateHtml({
      document: buildFakeDocument(),
      lineItems: buildFakeLineItems(),
      discounts: buildFakeDiscounts(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'bg',
    });

    expect(withStoredDiscounts).toBe(withoutDiscounts);
    expect(withoutDiscounts).not.toContain('Отстъпка');
    expect(withoutDiscounts).not.toContain('Междинна сума');
  });

  it('prints a subtotal and a percentage+label discount row before the taxable base (bg)', () => {
    const document = buildFakeDocument({
      subtotal: 1000000,
      discountTotal: 100000,
      amount: 1080000,
      vatRateBp: 2000,
      vatAmount: 180000,
    });

    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeLineItems(),
      discounts: buildFakeDiscounts({ percentBp: 1000, label: 'Лоялен клиент' }),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('Междинна сума:');
    expect(html).toContain('10 000,00 €');
    expect(html).toContain('Отстъпка (10%) – Лоялен клиент:');
    expect(html).toContain('-1 000,00 €');
    expect(html).toContain('Данъчна основа:');
    expect(html).toContain('9 000,00 €');
    expect(html).toContain('ДДС (20%):');
    expect(html).toContain('1 800,00 €');
    expect(html).toContain('10 800,00 €');
  });

  it('prints a subtotal and a percentage discount row before the taxable base (en)', () => {
    const document = buildFakeDocument({
      subtotal: 500000,
      discountTotal: 50000,
      amount: 540000,
      vatRateBp: 2000,
      vatAmount: 90000,
    });

    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeLineItems(),
      discounts: buildFakeDiscounts({ percentBp: 1000, label: '' }),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'en',
    });

    expect(html).toContain('Subtotal:');
    expect(html).toContain('€5,000.00');
    expect(html).toContain('Discount (10%):');
    expect(html).toContain('-€500.00');
    expect(html).toContain('Net amount (excl. VAT):');
    expect(html).toContain('€4,500.00');
    expect(html).toContain('VAT (20%):');
    expect(html).toContain('€900.00');
    expect(html).toContain('€5,400.00');
  });

  it('prints a flat-amount discount with a custom label and no percentage (bg)', () => {
    const document = buildFakeDocument({
      subtotal: 200000,
      discountTotal: 15000,
      amount: 222000,
      vatRateBp: 2000,
      vatAmount: 37000,
    });

    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeLineItems(),
      discounts: buildFakeDiscounts({ percentBp: null, amount: 15000, label: 'Промо код ХХ' }),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('2 000,00 €');
    expect(html).toContain('Отстъпка – Промо код ХХ:');
    expect(html).not.toContain('Отстъпка (');
    expect(html).toContain('-150,00 €');
    expect(html).toContain('1 850,00 €');
    expect(html).toContain('370,00 €');
    expect(html).toContain('2 220,00 €');
  });

  it('falls back to a plain discount label when several discounts make up the total', () => {
    const document = buildFakeDocument({
      subtotal: 100000,
      discountTotal: 20000,
      amount: 96000,
      vatRateBp: 2000,
      vatAmount: 16000,
    });

    const html = renderClassicTemplateHtml({
      document,
      lineItems: buildFakeLineItems(),
      discounts: [
        ...buildFakeDiscounts({ id: 'disc_1', percentBp: 500, label: 'Ранно плащане' }),
        ...buildFakeDiscounts({ id: 'disc_2', percentBp: 1500, label: 'Обем' }),
      ],
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('Отстъпка:');
    expect(html).toContain('-200,00 €');
  });

  it('prints the subtotal and discount rows once above the mixed-VAT group rows (bg)', () => {
    const document = buildFakeDocument({
      subtotal: 100000,
      discountTotal: 10000,
      amount: 99000,
      vatRateBp: 2000,
      vatAmount: 9000,
      vatExemptionGround: 'Обратно начисляване – чл. 21, ал. 2 от ЗДДС',
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
      isDraft: false,
      language: 'bg',
    });

    expect(html).toContain('Междинна сума:');
    expect(html).toContain('1 000,00 €');
    expect(html).toContain('Отстъпка:');
    expect(html).toContain('-100,00 €');
    expect(html).toContain('Данъчна основа:');
    expect(html).toContain('Данъчна основа (20%):');
    expect(html).toContain('450,00 €');
    expect(html).toContain('ДДС (20%):');
    expect(html).toContain('90,00 €');
    expect(html).toContain(
      '<div class="exemption">Обратно начисляване – чл. 21, ал. 2 от ЗДДС</div>',
    );
    expect((html.match(/Данъчна основа:/g) ?? []).length).toBe(1);
    expect((html.match(/Данъчна основа \(20%\):/g) ?? []).length).toBe(1);
    expect((html.match(/Междинна сума:/g) ?? []).length).toBe(1);
    expect(html).toContain('990,00 €');
  });
});
