import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { buildDatesBlock, buildRecipientBlock } from './header-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('supplier heading', () => {
  it('prints the supplier title as the first row of the issuer block, per language', () => {
    const cases: Array<[string, string]> = [
      ['bg', 'Доставчик:'],
      ['en', 'Supplier:'],
      ['de', 'Aussteller:'],
      ['fr', 'Émetteur :'],
      ['it', 'Cedente/prestatore:'],
      ['pl', 'Sprzedawca:'],
      ['ro', 'Furnizor:'],
      ['es', 'Emisor:'],
    ];
    for (const [language, expected] of cases) {
      const locale = resolveClassicLocale(language as never);
      const html = buildIssuerBlock(buildFakeDocument(), 'invoice', locale);
      expect(html).toContain(`<div class="block-title">${expected}</div>`);
    }
  });
});

describe('recipientTitle as a function of document type', () => {
  it('DE: uses Empfänger for a quote, Lieferanschrift for a delivery note, Rechnungsempfänger otherwise', () => {
    const locale = resolveClassicLocale('de', 'DE');
    expect(buildRecipientBlock(buildFakeDocument(), 'invoice', locale)).toContain(
      'Rechnungsempfänger:',
    );
    expect(buildRecipientBlock(buildFakeDocument(), 'quote', locale)).toContain('Empfänger:');
    expect(buildRecipientBlock(buildFakeDocument(), 'delivery_note', locale)).toContain(
      'Lieferanschrift:',
    );
  });

  it('PL: uses Klient for a quote and Odbiorca for a delivery note, Nabywca otherwise', () => {
    const locale = resolveClassicLocale('pl', 'PL');
    expect(buildRecipientBlock(buildFakeDocument(), 'invoice', locale)).toContain('Nabywca:');
    expect(buildRecipientBlock(buildFakeDocument(), 'quote', locale)).toContain('Klient:');
    expect(buildRecipientBlock(buildFakeDocument(), 'delivery_note', locale)).toContain(
      'Odbiorca:',
    );
  });

  it('RO: uses Destinatar for a delivery note, Cumpărător otherwise', () => {
    const locale = resolveClassicLocale('ro', 'RO');
    expect(buildRecipientBlock(buildFakeDocument(), 'invoice', locale)).toContain('Cumpărător:');
    expect(buildRecipientBlock(buildFakeDocument(), 'delivery_note', locale)).toContain(
      'Destinatar:',
    );
  });
});

describe('DE issuedAtPrefix as a function of document type', () => {
  const locale = resolveClassicLocale('de', 'DE');

  it('uses Angebotsdatum for a quote', () => {
    const html = buildDatesBlock(buildFakeDocument(), 'quote', locale);
    expect(html).toContain('Angebotsdatum: ');
  });

  it('uses Datum for a delivery note and a proforma', () => {
    expect(buildDatesBlock(buildFakeDocument(), 'delivery_note', locale)).toContain('Datum: ');
    expect(buildDatesBlock(buildFakeDocument(), 'proforma', locale)).toContain('Datum: ');
  });

  it('uses Rechnungsdatum for an invoice and debit note, Datum for a credit note', () => {
    expect(buildDatesBlock(buildFakeDocument(), 'invoice', locale)).toContain('Rechnungsdatum: ');
    expect(buildDatesBlock(buildFakeDocument(), 'debit_note', locale)).toContain(
      'Rechnungsdatum: ',
    );
    expect(buildDatesBlock(buildFakeDocument(), 'credit_note', locale)).toContain('Datum: ');
  });
});

describe('proforma dates block', () => {
  it('prints the issue date but no tax-event or supply-date row', () => {
    const locale = resolveClassicLocale('bg', 'BG');
    const html = buildDatesBlock(buildFakeDocument(), 'proforma', locale);
    expect(html).toContain('Дата на издаване: ');
    expect(html).not.toContain('Данъчно събитие');
    expect(html).not.toContain('Дата на доставка');
    expect(html).not.toContain('Валидно до');
  });
});
