import { describe, expect, it } from 'vitest';
import type { ClassicLanguage } from './labels';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

function render(
  language: ClassicLanguage,
  issuerCountry: string,
  overrides: Record<string, unknown>,
  ground: string | null,
  lineOverrides: Record<string, unknown> = {},
) {
  return renderClassicTemplateHtml({
    document: buildFakeDocument({
      issuerCountry,
      vatRateBp: 0,
      vatAmount: 0,
      amount: 458333,
      vatExemptionGround: ground,
      ...overrides,
    }),
    lineItems: buildFakeLineItems({ vatRateBp: 0, vatCategory: 'O', ...lineOverrides }),
    presentation: {
      vatCharged: false,
      showExemptionLine: ground !== null,
      exemptionGround: ground,
    },
    isDraft: false,
    language,
    issuerCountry,
  });
}

describe('tax invoices without VAT', () => {
  it('print the taxable amount for a VAT-registered issuer', () => {
    const html = render('bg', 'BG', {}, null, { vatCategory: 'AE' });
    expect(html).toContain('Данъчна основа:');
    expect(html).not.toContain('ДДС (0%):');
  });

  it('print no taxable amount for a non-registered issuer', () => {
    const html = render('bg', 'BG', { issuerVatRegistered: false }, 'чл. 113, ал. 9 от ЗДДС');
    expect(html).not.toContain('Данъчна основа:');
  });

  it('print a 0% row and the zero-rate prefix for a Bulgarian zero-rate ground', () => {
    const html = render('bg', 'BG', {}, 'чл. 53, ал. 1 от ЗДДС');
    expect(html).toContain('Данъчна основа:');
    expect(html).toContain('ДДС (0%):');
    expect(html).toContain('Основание за прилагане на нулева ставка: чл. 53, ал. 1 от ЗДДС');
  });

  it('label the total without "incl. VAT" when no VAT is charged', () => {
    const html = render('en', 'IE', {}, null, { vatCategory: 'AE' });
    expect(html).toContain('Total:');
    expect(html).not.toContain('Total (incl. VAT):');
  });
});

describe('PL export line — full pipeline (matches the PL-04 prod scenario)', () => {
  it('prints "0%" in the line-items VAT-rate column, not "zw" (export is a 0%-rate ground, not an exemption)', () => {
    const ground = 'eksport towarów – art. 41 ust. 4 i 5 ustawy o podatku od towarów i usług';
    const html = render('pl', 'PL', {}, ground, { vatCategory: 'E' });
    expect(html).toContain('>0%<');
    expect(html).not.toContain('>zw<');
    // The document-level note keeps printing bare, with no exemption prefix.
    expect(html).toContain(`<div class="exemption">${ground}</div>`);
  });
});

describe('reverse-charge wording when the user picks the EU-services ground', () => {
  it('pl adds "odwrotne obciążenie" to the art. 28b ground', () => {
    const ground =
      'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b ustawy o podatku od towarów i usług';
    expect(render('pl', 'PL', {}, ground)).toContain('odwrotne obciążenie');
  });

  it('ro adds "Taxare inversă" to the art. 278 ground', () => {
    const ground = 'Neimpozabil în România conform art. 278 alin. (2) din Codul fiscal';
    expect(render('ro', 'RO', {}, ground)).toContain('Taxare inversă');
  });
});

describe('Italian stamp duty', () => {
  it('is not charged on an intra-EU supply of goods chosen as ground', () => {
    const ground =
      'Operazione non imponibile ai sensi dell’art. 41, comma 1, lett. a), D.L. 331/1993';
    expect(render('it', 'IT', {}, ground)).not.toContain('Imposta di bollo');
  });

  it('is charged on art. 7-ter services to an EU customer under automatic reverse charge', () => {
    const html = render('it', 'IT', { recipientCountry: 'DE' }, null, { vatCategory: 'AE' });
    expect(html).toContain('Imposta di bollo');
  });

  it('is not charged on a domestic reverse charge', () => {
    const html = render('it', 'IT', { recipientCountry: 'IT' }, null, { vatCategory: 'AE' });
    expect(html).not.toContain('Imposta di bollo');
  });

  it('cites art. 6 of the D.M. 17 giugno 2014', () => {
    const html = render('it', 'IT', { issuerVatRegistered: false }, null);
    expect(html).toContain('ai sensi dell’art. 6 del D.M. 17 giugno 2014');
  });
});

describe('credit note refund row', () => {
  it('prints the refund amount without a minus sign when the label already says refund', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ documentType: 'CREDIT_NOTE', number: 3, issuerCountry: 'PL' }),
      lineItems: buildFakeLineItems(),
      presentation: { vatCharged: true, showExemptionLine: false, exemptionGround: null },
      isDraft: false,
      language: 'pl',
      issuerCountry: 'PL',
    });
    expect(html).toContain('Do zwrotu:</span><span>5 500,00 €');
    expect(html).toContain('-5 500,00 €');
  });
});

describe('Irish supplementary invoice', () => {
  it('titles an IE debit note "Supplementary invoice" and keeps "Debit note" elsewhere', () => {
    const ie = render('en', 'IE', { documentType: 'DEBIT_NOTE', number: 7 }, null);
    const nl = render('en', 'NL', { documentType: 'DEBIT_NOTE', number: 7 }, null);
    expect(ie).toContain('Supplementary invoice no. 0000000007');
    expect(nl).toContain('Debit note no. 0000000007');
  });
});

describe('mixed invoices', () => {
  it('print the taxable amount and 0% row of a zero-rated group next to the taxed group', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        issuerCountry: 'BG',
        subtotal: 100000,
        vatAmount: 10000,
        amount: 110000,
        vatExemptionGround: 'чл. 53, ал. 1 от ЗДДС',
      }),
      lineItems: [
        ...buildFakeLineItems({ lineTotal: 50000, vatRateBp: 2000, vatCategory: 'S' }),
        ...buildFakeLineItems({ id: 'li_2', lineTotal: 50000, vatRateBp: 0, vatCategory: 'K' }),
      ],
      presentation: { vatCharged: true, showExemptionLine: false, exemptionGround: null },
      isDraft: false,
      language: 'bg',
      issuerCountry: 'BG',
    });
    expect((html.match(/Данъчна основа:/g) ?? []).length).toBe(1);
    expect(html).toContain('Данъчна основа (20%):');
    expect(html).toContain('ДДС (20%):');
    expect(html).toContain('ДДС (0%):');
    expect(html).toContain('Основание за прилагане на нулева ставка: чл. 53, ал. 1 от ЗДДС');
  });

  it('adds a total-VAT row summing every rate, matching the BG-01 prod scenario (20% + 9%)', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        issuerCountry: 'BG',
        subtotal: 109000,
        vatAmount: 19160,
        amount: 128160,
        vatExemptionGround: null,
      }),
      lineItems: [
        ...buildFakeLineItems({ lineTotal: 85000, vatRateBp: 2000, vatCategory: 'S' }),
        ...buildFakeLineItems({ id: 'li_2', lineTotal: 24000, vatRateBp: 900, vatCategory: 'S' }),
      ],
      presentation: { vatCharged: true, showExemptionLine: false, exemptionGround: null },
      isDraft: false,
      language: 'bg',
      issuerCountry: 'BG',
    });
    expect(html).toContain('ДДС (20%):');
    expect(html).toContain('ДДС (9%):');
    // 170,00 + 21,60 = 191,60
    expect(html).toContain('Общо ДДС:</span><span>191,60 €');
  });

  it('does not add a total-VAT row on a single-rate document', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ issuerCountry: 'BG', vatAmount: 91667 }),
      lineItems: buildFakeLineItems(),
      presentation: { vatCharged: true, showExemptionLine: false, exemptionGround: null },
      isDraft: false,
      language: 'bg',
      issuerCountry: 'BG',
    });
    expect(html).not.toContain('Общо ДДС:');
  });
});
