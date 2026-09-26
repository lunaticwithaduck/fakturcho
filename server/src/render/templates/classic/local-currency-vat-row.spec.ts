import { describe, expect, it } from 'vitest';
import { getClassicLabels } from './labels';
import { buildLocalCurrencyVatRow } from './local-currency-vat-row';
import { buildFakeDocument } from './testing/fake-document';

describe('buildLocalCurrencyVatRow', () => {
  it('renders nothing when the document has no exchange-rate snapshot', () => {
    const document = buildFakeDocument();
    const html = buildLocalCurrencyVatRow(document, getClassicLabels('en'), 'en', 1);
    expect(html).toBe('');
  });

  it('PL: matches the ustawa o VAT art. 106e ust. 11 wording exactly', () => {
    const document = buildFakeDocument({
      vatAmount: 123456,
      localCurrency: 'PLN',
      exchangeRate: '4.2512',
      exchangeRateDate: new Date('2026-09-17T00:00:00.000Z'),
      exchangeRateSource: 'NBP',
      exchangeRateTable: '181/A/NBP/2026',
      vatAmountLocal: 524933,
    });
    const html = buildLocalCurrencyVatRow(document, getClassicLabels('pl'), 'pl', 1);
    expect(html).toContain(
      'Kwota VAT w PLN: 5 249,33 zł (kurs NBP 4,2512 z dnia 17.09.2026, tabela nr 181/A/NBP/2026)',
    );
  });

  it('RO: matches the Codul fiscal art. 319 wording, with no table number', () => {
    const document = buildFakeDocument({
      localCurrency: 'RON',
      exchangeRate: '4.9771',
      exchangeRateDate: new Date('2026-09-17T00:00:00.000Z'),
      exchangeRateSource: 'BNR',
      exchangeRateTable: null,
      vatAmountLocal: 123456,
    });
    const html = buildLocalCurrencyVatRow(document, getClassicLabels('ro'), 'ro', 1);
    expect(html).toContain('TVA în lei: 1.234,56 lei (curs BNR 4,9771 din 17.09.2026)');
    expect(html).not.toContain('tabelul');
  });

  it('negates the amount for a credit note', () => {
    const document = buildFakeDocument({
      localCurrency: 'PLN',
      exchangeRate: '4.2512',
      exchangeRateDate: new Date('2026-09-17T00:00:00.000Z'),
      exchangeRateSource: 'NBP',
      exchangeRateTable: null,
      vatAmountLocal: 524933,
    });
    const html = buildLocalCurrencyVatRow(document, getClassicLabels('pl'), 'pl', -1);
    expect(html).toContain('-5 249,33 zł');
  });

  it('localizes the ECB acronym per document language, for CZ/DK/HU/SE', () => {
    const document = buildFakeDocument({
      localCurrency: 'CZK',
      exchangeRate: '25.30',
      exchangeRateDate: new Date('2026-09-17T00:00:00.000Z'),
      exchangeRateSource: 'ECB',
      exchangeRateTable: null,
      vatAmountLocal: 100000,
    });
    expect(buildLocalCurrencyVatRow(document, getClassicLabels('en'), 'en', 1)).toContain(
      'ECB rate',
    );
    expect(buildLocalCurrencyVatRow(document, getClassicLabels('de'), 'de', 1)).toContain(
      'EZB-Kurs',
    );
    expect(buildLocalCurrencyVatRow(document, getClassicLabels('bg'), 'bg', 1)).toContain(
      'курс ЕЦБ',
    );
  });

  it('prints one line per rate once vatAmountLocalByRate has more than one entry', () => {
    const document = buildFakeDocument({
      localCurrency: 'PLN',
      exchangeRate: '4.2512',
      exchangeRateDate: new Date('2026-09-17T00:00:00.000Z'),
      exchangeRateSource: 'NBP',
      exchangeRateTable: null,
      vatAmountLocal: 703697,
      vatAmountLocalByRate: [
        { rateBp: 2300, vatAmountLocal: 586700 },
        { rateBp: 800, vatAmountLocal: 91800 },
      ],
    });
    const html = buildLocalCurrencyVatRow(document, getClassicLabels('pl'), 'pl', 1);
    expect(html).toContain('Kwota VAT w PLN (23%): 5 867,00 zł');
    expect(html).toContain('Kwota VAT w PLN (8%): 918,00 zł');
    expect((html.match(/vat-local-currency/g) ?? []).length).toBe(2);
  });

  it('still prints a single line when vatAmountLocalByRate has only one entry', () => {
    const document = buildFakeDocument({
      localCurrency: 'PLN',
      exchangeRate: '4.2512',
      exchangeRateDate: new Date('2026-09-17T00:00:00.000Z'),
      exchangeRateSource: 'NBP',
      exchangeRateTable: null,
      vatAmountLocal: 524933,
      vatAmountLocalByRate: [{ rateBp: 2300, vatAmountLocal: 524933 }],
    });
    const html = buildLocalCurrencyVatRow(document, getClassicLabels('pl'), 'pl', 1);
    expect(html).toContain('Kwota VAT w PLN: 5 249,33 zł');
    expect((html.match(/vat-local-currency/g) ?? []).length).toBe(1);
  });

  it('escapes HTML in the composed line', () => {
    const document = buildFakeDocument({
      localCurrency: 'PLN',
      exchangeRate: '4.2512',
      exchangeRateDate: new Date('2026-09-17T00:00:00.000Z'),
      exchangeRateSource: 'NBP',
      exchangeRateTable: '<script>',
      vatAmountLocal: 100000,
    });
    const html = buildLocalCurrencyVatRow(document, getClassicLabels('pl'), 'pl', 1);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
