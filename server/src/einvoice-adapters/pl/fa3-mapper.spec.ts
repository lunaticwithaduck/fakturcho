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
});

describe('toFa3Xml — credit note type', () => {
  it('emits RodzajFaktury KOR for a credit_note', () => {
    const creditNote: DocumentDto = {
      ...plDomesticStandardInvoice,
      documentType: 'credit_note',
      originalDocumentId: 'doc-pl-domestic-1',
    };
    const xml = toFa3Xml(creditNote);
    expect(xml).toContain('<RodzajFaktury>KOR</RodzajFaktury>');
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
    expect(xml).toContain('<NrVatUE>DE123456789</NrVatUE>');
    expect(xml).toContain('<P_12>oo</P_12>');
    expect(xml).toContain('<P_13_10>');
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
