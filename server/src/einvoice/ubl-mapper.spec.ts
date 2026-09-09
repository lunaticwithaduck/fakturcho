import type { DocumentDto, VatSubtotal } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { computeVatSubtotals } from '../vat-eu/subtotals';
import { bgDomesticStandardInvoice } from './__fixtures__/bg-domestic-standard';
import { deDomesticStandardInvoice } from './__fixtures__/eu-domestic-standard';
import { bgToEuReverseChargeInvoice } from './__fixtures__/eu-reverse-charge';
import { toUblXml } from './ubl-mapper';

function expectedSubtotals(document: DocumentDto): VatSubtotal[] {
  return computeVatSubtotals(document.lineItems);
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('toUblXml — BG domestic, standard rate', () => {
  const xml = toUblXml(bgDomesticStandardInvoice);

  it('starts with an XML declaration and a single Invoice root', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Invoice')).toBe(true);
    expect(countOccurrences(xml, '<Invoice ')).toBe(1);
    expect(xml.endsWith('</Invoice>')).toBe(true);
  });

  it('carries document type code 380 and the EUR currency', () => {
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>');
  });

  it('carries issuer and recipient names with BG country codes', () => {
    expect(xml).toContain('<cbc:RegistrationName>Тестова Компания ЕООД</cbc:RegistrationName>');
    expect(xml).toContain('<cbc:RegistrationName>Клиентска Фирма ООД</cbc:RegistrationName>');
    expect(countOccurrences(xml, '<cbc:IdentificationCode>BG</cbc:IdentificationCode>')).toBe(2);
  });

  it('carries the line VAT category code', () => {
    expect(xml).toContain('<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID>');
  });

  it('has one TaxSubtotal per distinct (category, rate) pair', () => {
    const expected = expectedSubtotals(bgDomesticStandardInvoice);
    expect(countOccurrences(xml, '<cac:TaxSubtotal>')).toBe(expected.length);
    for (const subtotal of expected) {
      expect(xml).toContain(
        `<cbc:TaxableAmount currencyID="EUR">${(subtotal.taxableAmount / 100).toFixed(2)}</cbc:TaxableAmount>`,
      );
      expect(xml).toContain(
        `<cbc:TaxAmount currencyID="EUR">${(subtotal.vatAmount / 100).toFixed(2)}</cbc:TaxAmount>`,
      );
    }
  });
});

describe('toUblXml — BG issuer, intra-EU reverse charge to a DE client', () => {
  const xml = toUblXml(bgToEuReverseChargeInvoice);

  it('carries document type code 380 and country codes BG/DE', () => {
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cbc:IdentificationCode>BG</cbc:IdentificationCode>');
    expect(xml).toContain('<cbc:IdentificationCode>DE</cbc:IdentificationCode>');
  });

  it('carries the AE VAT category at 0% with the exemption reason', () => {
    expect(xml).toContain(
      '<cac:ClassifiedTaxCategory><cbc:ID>AE</cbc:ID><cbc:Percent>0.00</cbc:Percent>',
    );
    expect(xml).toContain(
      '<cbc:TaxExemptionReason>чл.28c(E)(3) 77/388/EEC</cbc:TaxExemptionReason>',
    );
  });

  it('has exactly one TaxSubtotal matching the group total', () => {
    const [subtotal, ...rest] = expectedSubtotals(bgToEuReverseChargeInvoice);
    expect(rest).toHaveLength(0);
    if (!subtotal) throw new Error('expected exactly one VAT subtotal group');
    expect(countOccurrences(xml, '<cac:TaxSubtotal>')).toBe(1);
    expect(xml).toContain(
      `<cbc:TaxableAmount currencyID="EUR">${(subtotal.taxableAmount / 100).toFixed(2)}</cbc:TaxableAmount>`,
    );
  });

  it('carries the buyer VAT number required for reverse charge', () => {
    expect(xml).toContain('<cac:PartyTaxScheme><cbc:CompanyID>DE123456789</cbc:CompanyID>');
  });
});

describe('toUblXml — DE issuer to a domestic DE client, standard rate', () => {
  const xml = toUblXml(deDomesticStandardInvoice);

  it('carries document type code 380, EUR currency and DE/DE country codes', () => {
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>');
    expect(countOccurrences(xml, '<cbc:IdentificationCode>DE</cbc:IdentificationCode>')).toBe(2);
  });

  it('carries issuer and recipient party names', () => {
    expect(xml).toContain('<cbc:RegistrationName>Muster Consulting GmbH</cbc:RegistrationName>');
    expect(xml).toContain('<cbc:RegistrationName>Beispiel AG</cbc:RegistrationName>');
  });

  it('carries the line VAT category at the 19% German standard rate', () => {
    expect(xml).toContain(
      '<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19.00</cbc:Percent>',
    );
  });

  it('has one TaxSubtotal matching the standard-rate group total', () => {
    const [subtotal] = expectedSubtotals(deDomesticStandardInvoice);
    if (!subtotal) throw new Error('expected one VAT subtotal group');
    expect(countOccurrences(xml, '<cac:TaxSubtotal>')).toBe(1);
    expect(xml).toContain(
      `<cbc:TaxAmount currencyID="EUR">${(subtotal.vatAmount / 100).toFixed(2)}</cbc:TaxAmount>`,
    );
  });
});

describe('toUblXml — credit note and debit note type codes', () => {
  it('emits 381 with CreditNote root and CreditNoteLine for a credit_note', () => {
    const creditNote: DocumentDto = {
      ...bgDomesticStandardInvoice,
      documentType: 'credit_note',
      originalDocumentId: 'doc-bg-domestic-1',
    };
    const xml = toUblXml(creditNote);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?><CreditNote');
    expect(xml).toContain('<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>');
    expect(xml).toContain('<cac:CreditNoteLine>');
    expect(xml).toContain('<cbc:CreditedQuantity unitCode="HUR">10</cbc:CreditedQuantity>');
    expect(xml.endsWith('</CreditNote>')).toBe(true);
  });

  it('emits 383 on an Invoice root for a debit_note', () => {
    const debitNote: DocumentDto = {
      ...bgDomesticStandardInvoice,
      documentType: 'debit_note',
      originalDocumentId: 'doc-bg-domestic-1',
    };
    const xml = toUblXml(debitNote);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?><Invoice');
    expect(xml).toContain('<cbc:InvoiceTypeCode>383</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cac:InvoiceLine>');
  });
});

describe('toUblXml — grouping with mixed VAT categories on one document', () => {
  it('produces one TaxSubtotal per distinct category/rate pair, not per line', () => {
    const mixed: DocumentDto = {
      ...bgDomesticStandardInvoice,
      lineItems: [
        ...bgDomesticStandardInvoice.lineItems,
        {
          id: 'line-2',
          name: 'Печатни материали',
          quantity: '5',
          unitPrice: 4000,
          lineTotal: 20000,
          sortOrder: 1,
          vatRateBp: 0,
          vatCategory: 'Z',
          unitCode: 'H87',
        },
        {
          id: 'line-3',
          name: 'Допълнителна консултация',
          quantity: '2',
          unitPrice: 10000,
          lineTotal: 20000,
          sortOrder: 2,
          vatRateBp: 2000,
          vatCategory: 'S',
          unitCode: 'HUR',
        },
      ],
    };
    const xml = toUblXml(mixed);
    const expected = expectedSubtotals(mixed);
    expect(expected).toHaveLength(2);
    expect(countOccurrences(xml, '<cac:TaxSubtotal>')).toBe(2);
    expect(countOccurrences(xml, '<cac:InvoiceLine>')).toBe(3);
  });
});

describe('toUblXml — out-of-scope document types', () => {
  it('throws for proforma', () => {
    const proforma: DocumentDto = { ...bgDomesticStandardInvoice, documentType: 'proforma' };
    expect(() => toUblXml(proforma)).toThrow();
  });

  it('throws for quote', () => {
    const quote: DocumentDto = { ...bgDomesticStandardInvoice, documentType: 'quote' };
    expect(() => toUblXml(quote)).toThrow();
  });
});

describe('toUblXml — XML escaping', () => {
  it('escapes special characters in free-text content', () => {
    const withSpecialChars: DocumentDto = {
      ...bgDomesticStandardInvoice,
      recipient: { ...bgDomesticStandardInvoice.recipient, companyName: 'A & B <Trading> "Ltd"' },
    };
    const xml = toUblXml(withSpecialChars);
    expect(xml).toContain('A &amp; B &lt;Trading&gt; &quot;Ltd&quot;');
    expect(xml).not.toContain('A & B <Trading>');
  });
});
