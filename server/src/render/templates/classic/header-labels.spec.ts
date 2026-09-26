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

describe('IT: EU VAT number label for a foreign client (art. 21 c.2 lett. f)', () => {
  it('prints "Numero identificativo IVA:" for a non-IT client on an IT-language document', () => {
    const locale = resolveClassicLocale('it', 'IT');
    const document = buildFakeDocument({
      recipientCountry: 'DE',
      recipientVatNumber: 'DE123456789',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Numero identificativo IVA: DE123456789');
    expect(html).not.toContain('P. IVA: DE123456789');
  });

  it('keeps "P. IVA:" for an Italian client', () => {
    const locale = resolveClassicLocale('it', 'IT');
    const document = buildFakeDocument({
      recipientCountry: 'IT',
      recipientVatNumber: 'IT12345678901',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('P. IVA: IT12345678901');
  });

  it('keeps the normal label in other document languages', () => {
    const locale = resolveClassicLocale('de', 'IT');
    const document = buildFakeDocument({
      recipientCountry: 'DE',
      recipientVatNumber: 'DE123456789',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('USt-IdNr.: DE123456789');
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

describe('buyerReference and paymentTermsNote (EN 16931 BT-10/BT-20)', () => {
  const cases: Array<[string, string, string]> = [
    ['bg', 'Ваша референция: ', 'Условия за плащане: '],
    ['en', 'Your reference: ', 'Payment terms: '],
    ['de', 'Ihre Referenz: ', 'Zahlungsbedingungen: '],
    ['fr', 'Votre référence : ', 'Conditions de paiement : '],
    ['it', 'Vostro riferimento: ', 'Termini di pagamento: '],
    ['pl', 'Numer referencyjny: ', 'Warunki płatności: '],
    ['ro', 'Referința dumneavoastră: ', 'Termeni de plată: '],
    ['es', 'Su referencia: ', 'Condiciones de pago: '],
  ];

  it('prints both when set, in every language', () => {
    for (const [language, buyerRefPrefix, paymentTermsPrefix] of cases) {
      const locale = resolveClassicLocale(language as never);
      const document = buildFakeDocument({
        buyerReference: 'PO-2026-118',
        paymentTermsNote: 'Net 14',
      });
      const html = buildDatesBlock(document, 'invoice', locale);
      expect(html).toContain(`${buyerRefPrefix}PO-2026-118`);
      expect(html).toContain(`${paymentTermsPrefix}Net 14`);
    }
  });

  it('prints neither when unset', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({ buyerReference: null, paymentTermsNote: null });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).not.toContain('Your reference');
    expect(html).not.toContain('Payment terms');
  });

  it('prints neither on a non-tax document such as a quote', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({
      buyerReference: 'PO-2026-118',
      paymentTermsNote: 'Net 14',
    });
    const html = buildDatesBlock(document, 'quote', locale);
    expect(html).not.toContain('Your reference');
    expect(html).not.toContain('Payment terms');
  });
});
