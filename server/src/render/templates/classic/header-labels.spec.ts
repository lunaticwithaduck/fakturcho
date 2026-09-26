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
    ['pl', 'Numer referencyjny: ', 'Termin płatności: '],
    ['ro', 'Referința dumneavoastră: ', 'Termen de plată: '],
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

describe('paymentTermsDays overrides paymentTermsNote with localized text', () => {
  const cases: Array<[string, string, string]> = [
    ['bg', 'Условия за плащане: ', '14 дни'],
    ['en', 'Payment terms: ', '14 days'],
    ['de', 'Zahlungsbedingungen: ', 'Zahlbar innerhalb von 14 Tagen'],
    ['fr', 'Conditions de paiement : ', '14 jours'],
    ['it', 'Termini di pagamento: ', '14 giorni'],
    ['pl', 'Termin płatności: ', '14 dni'],
    ['ro', 'Termen de plată: ', '14 zile'],
  ];

  it('prints the localized day count instead of the raw note, in every language', () => {
    for (const [language, prefix, expectedDays] of cases) {
      const locale = resolveClassicLocale(language as never);
      const document = buildFakeDocument({ paymentTermsDays: 14, paymentTermsNote: 'Net 14' });
      const html = buildDatesBlock(document, 'invoice', locale);
      expect(html).toContain(`${prefix}${expectedDays}`);
      expect(html).not.toContain('Net 14');
    }
  });

  it('prints "due on receipt" wording for 0 days', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({ paymentTermsDays: 0, paymentTermsNote: null });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).toContain('Payment terms: on receipt');
  });

  it('DE: prints "Sofort nach Erhalt" for 0 days', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const document = buildFakeDocument({ paymentTermsDays: 0, paymentTermsNote: null });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).toContain('Zahlungsbedingungen: Sofort nach Erhalt');
  });

  it('falls back to the raw paymentTermsNote when paymentTermsDays is unset', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({ paymentTermsDays: null, paymentTermsNote: 'Net 14' });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).toContain('Payment terms: Net 14');
  });
});

describe('due date (dueAt) on the header dates block', () => {
  it('prints a localized due-date row for bg/de/it/ro on a due invoice', () => {
    const cases: Array<[string, string]> = [
      ['bg', 'Срок за плащане: '],
      ['de', 'Zahlbar bis: '],
      ['it', 'Scadenza: '],
      ['ro', 'Data scadenței: '],
    ];
    for (const [language, prefix] of cases) {
      const locale = resolveClassicLocale(language as never);
      const document = buildFakeDocument({
        dueAt: new Date('2026-10-10'),
        paymentTermsDays: 14,
      });
      const html = buildDatesBlock(document, 'invoice', locale);
      expect(html).toContain(prefix);
      expect(html).toContain(dueDateTextFor(language));
    }
  });

  it('PL merges the due date and the day count into the payment-terms line', () => {
    const locale = resolveClassicLocale('pl', 'PL');
    const document = buildFakeDocument({ dueAt: new Date('2026-10-10'), paymentTermsDays: 14 });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).toContain('Termin płatności: 10.10.2026 (14 dni)');
  });

  it('RO uses "de" before zile from twenty days up', () => {
    const labels = resolveClassicLocale('ro', 'RO').labels;
    expect(labels.paymentTermsDaysText(14)).toBe('14 zile');
    expect(labels.paymentTermsDaysText(30)).toBe('30 de zile');
    expect(labels.paymentTermsDaysText(60)).toBe('60 de zile');
  });

  it('PL prints a custom due date without a day count', () => {
    const locale = resolveClassicLocale('pl', 'PL');
    const document = buildFakeDocument({
      dueAt: new Date('2026-10-10'),
      paymentTermsDays: null,
      paymentTermsNote: null,
    });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).toContain('Termin płatności: 10.10.2026');
    expect(html).not.toContain('10.10.2026 (');
  });

  it('PL keeps a free-text payment note next to a custom due date', () => {
    const locale = resolveClassicLocale('pl', 'PL');
    const document = buildFakeDocument({
      dueAt: new Date('2026-10-10'),
      paymentTermsDays: null,
      paymentTermsNote: 'przelew',
    });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).toContain('Termin płatności: 10.10.2026 (przelew)');
  });

  it('FR does not print a due-date row here (mentions/fr.ts already states it)', () => {
    const locale = resolveClassicLocale('fr', 'FR');
    const document = buildFakeDocument({ dueAt: new Date('2026-10-10'), paymentTermsDays: 14 });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).not.toContain('échéance');
    expect(html).toContain('Conditions de paiement : 14 jours');
  });

  it('is not printed on a credit note, a quote, a proforma or a delivery note', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({ dueAt: new Date('2026-10-10'), paymentTermsDays: 14 });
    expect(buildDatesBlock(document, 'credit_note', locale)).not.toContain('Due date');
    expect(buildDatesBlock(document, 'quote', locale)).not.toContain('Due date');
    expect(buildDatesBlock(document, 'proforma', locale)).not.toContain('Due date');
    expect(buildDatesBlock(document, 'delivery_note', locale)).not.toContain('Due date');
  });

  it('is printed on a debit note', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({ dueAt: new Date('2026-10-10'), paymentTermsDays: 14 });
    expect(buildDatesBlock(document, 'debit_note', locale)).toContain('Due date: 10/10/2026');
  });

  it('is not printed when the document has no due date', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({ dueAt: null, paymentTermsDays: 14 });
    expect(buildDatesBlock(document, 'invoice', locale)).not.toContain('Due date');
  });
});

function dueDateTextFor(language: string): string {
  return { bg: '10.10.2026', de: '10.10.2026', it: '10/10/2026', ro: '10.10.2026' }[
    language
  ] as string;
}
