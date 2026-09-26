import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { plDomesticStandardInvoice } from './__fixtures__/pl-domestic-standard';
import { toFa3Xml } from './fa3-mapper';

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const [baseLineItem] = plDomesticStandardInvoice.lineItems;
if (!baseLineItem) throw new Error('expected fixture to carry a line item');

describe('toFa3Xml — PL domestic, standard 23% rate', () => {
  const xml = toFa3Xml(plDomesticStandardInvoice);

  it('starts with an XML declaration and a single Faktura root', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Faktura')).toBe(true);
    expect(countOccurrences(xml, '<Faktura ')).toBe(1);
    expect(xml.endsWith('</Faktura>')).toBe(true);
  });

  it('carries the FA (3) form code and variant', () => {
    expect(xml).toContain(
      '<KodFormularza kodSystemowy="FA (3)" wersjaSchemy="1-0E">FA</KodFormularza>',
    );
    expect(xml).toContain('<WariantFormularza>3</WariantFormularza>');
  });

  it('carries seller and buyer NIPs stripped of the PL prefix', () => {
    expect(xml).toContain('<Podmiot1>');
    expect(xml).toContain('<NIP>1234563218</NIP>');
    expect(xml).toContain('<NIP>5260001246</NIP>');
  });

  it('carries the seller and buyer company names', () => {
    expect(xml).toContain('<Nazwa>Testowa Spółka z o.o.</Nazwa>');
    expect(xml).toContain('<Nazwa>Klient Testowy Sp. z o.o.</Nazwa>');
  });

  it('carries the buyer street as AdresL1 and postcode/city as AdresL2', () => {
    expect(xml).toContain('<AdresL1>ul. Nowy Świat 5</AdresL1><AdresL2>00-029 Warszawa</AdresL2>');
  });

  it('derives the town from the last comma segment of the free-text address, postcode stripped, when postcode and city are missing', () => {
    const legacy: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: {
        ...plDomesticStandardInvoice.recipient,
        postcode: null,
        city: null,
        address: 'ul. Nowy Świat 5, 00-029 Warszawa',
      },
    };
    const xml = toFa3Xml(legacy);
    expect(xml).toContain('<AdresL2>Warszawa</AdresL2>');
    expect(xml).not.toContain('ul. Nowy Świat 5, 00-029 Warszawa');
  });

  it('carries the standard-rate line at P_12 code 23', () => {
    expect(xml).toContain('<P_12>23</P_12>');
  });

  it('carries the net and VAT amounts in the P_13_1/P_14_1 bucket', () => {
    expect(xml).toContain('<P_13_1>1000.00</P_13_1>');
    expect(xml).toContain('<P_14_1>230.00</P_14_1>');
  });

  it('carries the gross total in P_15', () => {
    expect(xml).toContain('<P_15>1230.00</P_15>');
  });

  it('marks RodzajFaktury as VAT for a standard invoice', () => {
    expect(xml).toContain('<RodzajFaktury>VAT</RodzajFaktury>');
  });

  it('marks the reverse-charge annotation as not applicable', () => {
    expect(xml).toContain('<P_18>2</P_18>');
  });

  it('marks the buyer as not a JST sub-unit and not a VAT group member', () => {
    expect(xml).toContain('<JST>2</JST>');
    expect(xml).toContain('<GV>2</GV>');
  });

  it('marks the annotation block as not concerning new means of transport', () => {
    expect(xml).toContain('<NoweSrodkiTransportu><P_22N>1</P_22N></NoweSrodkiTransportu>');
  });
});

describe('toFa3Xml — credit note type', () => {
  const creditNote: DocumentDto = {
    ...plDomesticStandardInvoice,
    documentType: 'credit_note',
    originalDocumentId: 'doc-pl-domestic-1',
    originalDocument: {
      number: 7,
      numberPrefix: null,
      numberSuffix: null,
      issuedAt: '2026-08-01',
      ksefNumber: '1234567890-20260801-EF0123456789-AB',
    },
  };
  const xml = toFa3Xml(creditNote);

  it('emits RodzajFaktury KOR for a credit_note', () => {
    expect(xml).toContain('<RodzajFaktury>KOR</RodzajFaktury>');
  });

  it('carries DaneFaKorygowanej with the KSeF number when the original went through KSeF', () => {
    expect(xml).toContain(
      '<DaneFaKorygowanej>' +
        '<DataWystFaKorygowanej>2026-08-01</DataWystFaKorygowanej>' +
        '<NrFaKorygowanej>0000000007</NrFaKorygowanej>' +
        '<NrKSeF>1</NrKSeF>' +
        '<NrKSeFFaKorygowanej>1234567890-20260801-EF0123456789-AB</NrKSeFFaKorygowanej>' +
        '</DaneFaKorygowanej>',
    );
    expect(xml).not.toContain('NrKSeFN');
  });

  it('places DaneFaKorygowanej after RodzajFaktury and before the FaWiersz line items, per the FA(3) schema', () => {
    const rodzajIndex = xml.indexOf('<RodzajFaktury>');
    const korygowanejIndex = xml.indexOf('<DaneFaKorygowanej>');
    const wierszIndex = xml.indexOf('<FaWiersz>');
    expect(rodzajIndex).toBeGreaterThan(-1);
    expect(korygowanejIndex).toBeGreaterThan(rodzajIndex);
    expect(wierszIndex).toBeGreaterThan(korygowanejIndex);
  });

  it('throws when the correction has no resolvable original document', () => {
    const unresolved: DocumentDto = {
      ...creditNote,
      originalDocument: null,
    };
    expect(() => toFa3Xml(unresolved)).toThrow();
  });

  it('carries PrzyczynaKorekty as a direct child of Fa, after RodzajFaktury and before DaneFaKorygowanej, when a correction reason is set', () => {
    const withReason: DocumentDto = { ...creditNote, correctionReason: 'Zwrot towaru' };
    const xmlWithReason = toFa3Xml(withReason);
    expect(xmlWithReason).toContain('<PrzyczynaKorekty>Zwrot towaru</PrzyczynaKorekty>');
    expect(xmlWithReason).not.toContain('<DaneFaKorygowanej><PrzyczynaKorekty>');
    const rodzajIndex = xmlWithReason.indexOf('<RodzajFaktury>');
    const przyczynaIndex = xmlWithReason.indexOf('<PrzyczynaKorekty>');
    const korygowanejIndex = xmlWithReason.indexOf('<DaneFaKorygowanej>');
    expect(przyczynaIndex).toBeGreaterThan(rodzajIndex);
    expect(przyczynaIndex).toBeLessThan(korygowanejIndex);
  });

  it('omits PrzyczynaKorekty when there is no correction reason', () => {
    expect(xml).not.toContain('PrzyczynaKorekty');
  });
});

describe('toFa3Xml — debit note type', () => {
  const debitNote: DocumentDto = {
    ...plDomesticStandardInvoice,
    documentType: 'debit_note',
    originalDocumentId: 'doc-pl-domestic-1',
    originalDocument: {
      number: 7,
      numberPrefix: null,
      numberSuffix: null,
      issuedAt: '2026-08-01',
      ksefNumber: null,
    },
  };
  const xml = toFa3Xml(debitNote);

  it('emits RodzajFaktury KOR for a debit_note — art. 106j makes it a correction, not a fresh VAT invoice', () => {
    expect(xml).toContain('<RodzajFaktury>KOR</RodzajFaktury>');
  });

  it('carries DaneFaKorygowanej with NrKSeFN when the original was issued outside KSeF', () => {
    expect(xml).toContain(
      '<DaneFaKorygowanej>' +
        '<DataWystFaKorygowanej>2026-08-01</DataWystFaKorygowanej>' +
        '<NrFaKorygowanej>0000000007</NrFaKorygowanej>' +
        '<NrKSeFN>1</NrKSeFN>' +
        '</DaneFaKorygowanej>',
    );
    expect(xml).not.toContain('NrKSeFFaKorygowanej');
  });
});

describe('toFa3Xml — standard invoice type', () => {
  it('never emits DaneFaKorygowanej for a plain VAT invoice', () => {
    const xml = toFa3Xml(plDomesticStandardInvoice);
    expect(xml).not.toContain('DaneFaKorygowanej');
  });

  it('wraps line items in FaWiersz, matching the FA(3) schema element name', () => {
    const xml = toFa3Xml(plDomesticStandardInvoice);
    expect(xml).toContain('<FaWiersz>');
    expect(xml).not.toContain('DaneFaWiersz');
  });
});

describe('toFa3Xml — reverse charge annotation', () => {
  it('flags P_18 as 1 when a line uses the AE VAT category', () => {
    const reverseCharge: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: {
        ...plDomesticStandardInvoice.recipient,
        country: 'DE',
        vatNumber: 'DE123456789',
      },
      vatExemptionGround: 'art. 28c(E)(3) 77/388/EEC',
      lineItems: [
        {
          ...baseLineItem,
          vatRateBp: 0,
          vatCategory: 'AE',
        },
      ],
    };
    const xml = toFa3Xml(reverseCharge);
    expect(xml).toContain('<P_18>1</P_18>');
    expect(xml).toContain('<KodUE>DE</KodUE>');
    // Broszura FA(3): NrVatUE is "bez literowego kodu kraju, który wskazano
    // w polu KodUE" — the DE prefix belongs in KodUE only.
    expect(xml).toContain('<NrVatUE>123456789</NrVatUE>');
    expect(xml).not.toContain('<NrVatUE>DE123456789</NrVatUE>');
    expect(xml).toContain('<P_12>np II</P_12>');
    expect(xml).toContain('<P_13_9>');
  });

  it('strips a national-format VAT number country prefix (e.g. ES) from NrVatUE too', () => {
    const reverseCharge: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: {
        ...plDomesticStandardInvoice.recipient,
        country: 'ES',
        vatNumber: 'ESB12345674',
      },
      vatExemptionGround: 'art. 28c(E)(3) 77/388/EEC',
      lineItems: [{ ...baseLineItem, vatRateBp: 0, vatCategory: 'AE' }],
    };
    const xml = toFa3Xml(reverseCharge);
    expect(xml).toContain('<KodUE>ES</KodUE>');
    expect(xml).toContain('<NrVatUE>B12345674</NrVatUE>');
  });
});

describe('toFa3Xml — exemption annotation', () => {
  it('carries the exemption ground when a line uses the E VAT category', () => {
    const exempt: DocumentDto = {
      ...plDomesticStandardInvoice,
      vatExemptionGround: 'art. 43 ust. 1 ustawy o VAT',
      lineItems: [
        {
          ...baseLineItem,
          vatRateBp: 0,
          vatCategory: 'E',
        },
      ],
    };
    const xml = toFa3Xml(exempt);
    expect(xml).toContain('<P_19>1</P_19>');
    expect(xml).toContain('<P_19A>art. 43 ust. 1 ustawy o VAT</P_19A>');
    expect(xml).toContain('<P_12>zw</P_12>');
  });

  it('throws for an exempt E line with no exemption ground (XSD requires P_19A/B/C when P_19=1)', () => {
    const exemptNoGround: DocumentDto = {
      ...plDomesticStandardInvoice,
      vatExemptionGround: null,
      lineItems: [{ ...baseLineItem, vatRateBp: 0, vatCategory: 'E' }],
    };
    expect(() => toFa3Xml(exemptNoGround)).toThrow();
  });
});

describe('toFa3Xml — PrefiksPodatnika', () => {
  it('emits PrefiksPodatnika PL for a VAT-registered issuer', () => {
    const xml = toFa3Xml(plDomesticStandardInvoice);
    expect(xml).toContain('<PrefiksPodatnika>PL</PrefiksPodatnika>');
  });

  it('omits PrefiksPodatnika for an issuer that is not VAT-registered (art. 113 exempt seller)', () => {
    const notVatRegistered: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuer: { ...plDomesticStandardInvoice.issuer, vatRegistered: false },
    };
    const xml = toFa3Xml(notVatRegistered);
    expect(xml).not.toContain('PrefiksPodatnika');
  });
});

describe('toFa3Xml — P_13_x bucket order follows the XSD sequence, not line order', () => {
  it('emits P_13_1 before P_13_2 even when the 8% line comes first', () => {
    const mixedRates: DocumentDto = {
      ...plDomesticStandardInvoice,
      lineItems: [
        { ...baseLineItem, id: 'line-1', vatRateBp: 800, vatCategory: 'S' },
        { ...baseLineItem, id: 'line-2', vatRateBp: 2300, vatCategory: 'S' },
      ],
    };
    const xml = toFa3Xml(mixedRates);
    expect(xml.indexOf('<P_13_1>')).toBeGreaterThan(-1);
    expect(xml.indexOf('<P_13_1>')).toBeLessThan(xml.indexOf('<P_13_2>'));
  });
});

describe('toFa3Xml — P_14_xW (VAT converted to PLN) for foreign-currency invoices', () => {
  it('emits P_14_1W using the document exchange-rate snapshot, right after P_14_1', () => {
    const eurInvoice: DocumentDto = {
      ...plDomesticStandardInvoice,
      currency: 'EUR',
      localCurrency: 'PLN',
      exchangeRate: '4.2000',
      exchangeRateDate: '2026-09-04',
      exchangeRateSource: 'NBP',
      exchangeRateTable: '171/A/NBP/2026',
      vatAmountLocal: 96600,
    };
    const xml = toFa3Xml(eurInvoice);
    expect(xml).toContain('<P_14_1>230.00</P_14_1><P_14_1W>966.00</P_14_1W>');
  });

  it('omits P_14_xW when the document carries no exchange-rate snapshot', () => {
    const xml = toFa3Xml(plDomesticStandardInvoice);
    expect(xml).not.toContain('P_14_1W');
  });

  it('emits a P_14_xW per rate bucket for a mixed-rate foreign-currency invoice', () => {
    const eurMixed: DocumentDto = {
      ...plDomesticStandardInvoice,
      currency: 'EUR',
      localCurrency: 'PLN',
      exchangeRate: '4.0000',
      exchangeRateDate: '2026-09-04',
      exchangeRateSource: 'NBP',
      exchangeRateTable: '171/A/NBP/2026',
      lineItems: [
        {
          ...baseLineItem,
          id: 'line-1',
          lineTotal: 100000,
          unitPrice: 100000,
          vatRateBp: 2300,
          vatCategory: 'S',
        },
        {
          ...baseLineItem,
          id: 'line-2',
          lineTotal: 100000,
          unitPrice: 100000,
          vatRateBp: 800,
          vatCategory: 'S',
        },
      ],
    };
    const xml = toFa3Xml(eurMixed);
    expect(xml).toContain('<P_14_1>230.00</P_14_1><P_14_1W>920.00</P_14_1W>');
    expect(xml).toContain('<P_14_2>80.00</P_14_2><P_14_2W>320.00</P_14_2W>');
  });
});

describe('toFa3Xml — out-of-scope document types', () => {
  it('throws for proforma', () => {
    const proforma: DocumentDto = { ...plDomesticStandardInvoice, documentType: 'proforma' };
    expect(() => toFa3Xml(proforma)).toThrow();
  });

  it('throws for quote', () => {
    const quote: DocumentDto = { ...plDomesticStandardInvoice, documentType: 'quote' };
    expect(() => toFa3Xml(quote)).toThrow();
  });
});

describe('toFa3Xml — XML escaping', () => {
  it('escapes special characters in free-text content', () => {
    const withSpecialChars: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: {
        ...plDomesticStandardInvoice.recipient,
        companyName: 'A & B <Trading> "Sp. z o.o."',
      },
    };
    const xml = toFa3Xml(withSpecialChars);
    expect(xml).toContain('A &amp; B &lt;Trading&gt; &quot;Sp. z o.o.&quot;');
    expect(xml).not.toContain('A & B <Trading>');
  });
});

describe('toFa3Xml — a document discount is reflected in the P_13/P_14 buckets', () => {
  it('keeps the buckets consistent with the discounted taxable base', () => {
    const discounted: DocumentDto = {
      ...plDomesticStandardInvoice,
      subtotal: 100000,
      discountTotal: 10000,
      vatAmount: 15300,
      amount: 105300,
      lineItems: [
        {
          ...baseLineItem,
          id: 'line-1',
          lineTotal: 60000,
          unitPrice: 60000,
          vatRateBp: 2300,
          vatCategory: 'S',
        },
        {
          ...baseLineItem,
          id: 'line-2',
          lineTotal: 40000,
          unitPrice: 40000,
          vatRateBp: 800,
          vatCategory: 'S',
        },
      ],
    };
    const xml = toFa3Xml(discounted);

    expect(xml).toContain('<P_13_1>540.00</P_13_1>');
    expect(xml).toContain('<P_14_1>124.20</P_14_1>');
    expect(xml).toContain('<P_13_2>360.00</P_13_2>');
    expect(xml).toContain('<P_14_2>28.80</P_14_2>');
    expect(xml).toContain('<P_15>1053.00</P_15>');
  });
});

describe('toFa3Xml — P_6 (date of sale) agrees with the PDF\'s "Data sprzedaży"', () => {
  it('takes P_6 from taxEventAt when it differs from deliveryDate', () => {
    const document: DocumentDto = {
      ...plDomesticStandardInvoice,
      taxEventAt: '2026-09-03',
      deliveryDate: '2026-09-05',
    };
    const xml = toFa3Xml(document);
    expect(xml).toContain('<P_6>2026-09-03</P_6>');
    expect(xml).not.toContain('<P_6>2026-09-05</P_6>');
  });

  it('falls back to deliveryDate when there is no taxEventAt', () => {
    const document: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuedAt: '2026-09-01',
      taxEventAt: null,
      deliveryDate: '2026-09-05',
    };
    const xml = toFa3Xml(document);
    expect(xml).toContain('<P_6>2026-09-05</P_6>');
  });

  it('omits P_6 when neither date is set', () => {
    const document: DocumentDto = {
      ...plDomesticStandardInvoice,
      taxEventAt: null,
      deliveryDate: null,
    };
    const xml = toFa3Xml(document);
    expect(xml).not.toContain('<P_6>');
  });

  it('omits P_6 when the sale date equals the issue date (P_1) — XSD: filled only when it differs', () => {
    const document: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuedAt: '2026-09-05',
      taxEventAt: '2026-09-05',
      deliveryDate: null,
    };
    const xml = toFa3Xml(document);
    expect(xml).not.toContain('<P_6>');
  });
});
