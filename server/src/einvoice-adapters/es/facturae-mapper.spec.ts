import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { esDomesticStandardInvoice } from './__fixtures__/es-domestic-standard';
import { toFacturaeXml } from './facturae-mapper';

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('toFacturaeXml — ES domestic, standard 21% rate', () => {
  const xml = toFacturaeXml(esDomesticStandardInvoice);

  it('starts with an XML declaration and a single Facturae root', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Facturae ')).toBe(true);
    expect(countOccurrences(xml, '<Facturae ')).toBe(1);
    expect(xml.endsWith('</Facturae>')).toBe(true);
  });

  it('carries the Facturae 3.2 schema version and EUR currency in FileHeader', () => {
    expect(xml).toContain('<SchemaVersion>3.2</SchemaVersion>');
    expect(xml).toContain('<InvoiceCurrencyCode>EUR</InvoiceCurrencyCode>');
    expect(xml).toContain('<TotalInvoicesAmount><TotalAmount>1210.00</TotalAmount>');
  });

  it('carries seller and buyer NIF/CIF tax identifiers', () => {
    expect(xml).toContain('<TaxIdentificationNumber>B12345674</TaxIdentificationNumber>');
    expect(xml).toContain('<TaxIdentificationNumber>B00000018</TaxIdentificationNumber>');
    expect(countOccurrences(xml, '<ResidenceTypeCode>R</ResidenceTypeCode>')).toBe(2);
  });

  it('carries seller and buyer corporate names and Spanish addresses', () => {
    expect(xml).toContain('<CorporateName>Servicios Digitales Iberia S.L.</CorporateName>');
    expect(xml).toContain('<CorporateName>Comercial Levante S.L.</CorporateName>');
    expect(countOccurrences(xml, '<CountryCode>ESP</CountryCode>')).toBe(2);
  });

  it('carries the invoice number in InvoiceHeader', () => {
    expect(xml).toContain('<InvoiceNumber>0000000015</InvoiceNumber>');
    expect(xml).toContain('<InvoiceDocumentType>FC</InvoiceDocumentType>');
    expect(xml).toContain('<InvoiceClass>OO</InvoiceClass>');
  });

  it('carries a single 21% IVA TaxesOutputs entry matching the taxable base', () => {
    expect(xml).toContain('<TaxRate>21.00</TaxRate>');
    expect(xml).toContain('<TaxableBase><TotalAmount>1000.00</TotalAmount></TaxableBase>');
    expect(xml).toContain('<TaxAmount><TotalAmount>210.00</TotalAmount></TaxAmount>');
  });

  it('carries InvoiceTotals matching the fixture amounts', () => {
    expect(xml).toContain('<TotalGrossAmount>1000.00</TotalGrossAmount>');
    expect(xml).toContain('<TotalTaxOutputs>210.00</TotalTaxOutputs>');
    expect(xml).toContain('<InvoiceTotal>1210.00</InvoiceTotal>');
  });

  it('carries one InvoiceLine with the item description and Facturae hour unit code', () => {
    expect(countOccurrences(xml, '<InvoiceLine>')).toBe(1);
    expect(xml).toContain(
      '<ItemDescription>Servicios de consultoría informática</ItemDescription>',
    );
    expect(xml).toContain('<UnitOfMeasure>02</UnitOfMeasure>');
    expect(xml).toContain('<UnitPriceWithoutTax>100.00</UnitPriceWithoutTax>');
  });
});

describe('toFacturaeXml — credit note maps to a rectificativa InvoiceClass', () => {
  it('emits InvoiceClass OR for a credit_note', () => {
    const creditNote: DocumentDto = {
      ...esDomesticStandardInvoice,
      documentType: 'credit_note',
      originalDocumentId: 'doc-es-domestic-1',
    };
    const xml = toFacturaeXml(creditNote);
    expect(xml).toContain('<InvoiceClass>OR</InvoiceClass>');
  });
});

describe('toFacturaeXml — out-of-scope document types', () => {
  it('throws for proforma', () => {
    const proforma: DocumentDto = { ...esDomesticStandardInvoice, documentType: 'proforma' };
    expect(() => toFacturaeXml(proforma)).toThrow();
  });

  it('throws for quote', () => {
    const quote: DocumentDto = { ...esDomesticStandardInvoice, documentType: 'quote' };
    expect(() => toFacturaeXml(quote)).toThrow();
  });
});

describe('toFacturaeXml — XML escaping', () => {
  it('escapes special characters in free-text content', () => {
    const withSpecialChars: DocumentDto = {
      ...esDomesticStandardInvoice,
      recipient: {
        ...esDomesticStandardInvoice.recipient,
        companyName: 'A & B <Trading> "S.L."',
      },
    };
    const xml = toFacturaeXml(withSpecialChars);
    expect(xml).toContain('A &amp; B &lt;Trading&gt; &quot;S.L.&quot;');
    expect(xml).not.toContain('A & B <Trading>');
  });
});

describe('toFacturaeXml — mixed VAT rates produce one TaxesOutputs entry per rate', () => {
  it('groups by category and rate, not by line', () => {
    const mixed: DocumentDto = {
      ...esDomesticStandardInvoice,
      lineItems: [
        ...esDomesticStandardInvoice.lineItems,
        {
          id: 'line-2',
          name: 'Material informático',
          quantity: '2',
          unitPrice: 5000,
          lineTotal: 10000,
          sortOrder: 1,
          vatRateBp: 1000,
          vatCategory: 'S',
          unitCode: 'C62',
        },
      ],
    };
    const xml = toFacturaeXml(mixed);
    const outputsStart = xml.indexOf('<TaxesOutputs>');
    const outputsEnd = xml.indexOf('</TaxesOutputs>');
    const headerTaxesOutputs = xml.slice(outputsStart, outputsEnd);
    expect(countOccurrences(headerTaxesOutputs, '<Tax>')).toBe(2);
    expect(xml).toContain('<TaxRate>21.00</TaxRate>');
    expect(xml).toContain('<TaxRate>10.00</TaxRate>');
    expect(countOccurrences(xml, '<InvoiceLine>')).toBe(2);
  });
});

describe('toFacturaeXml — a document discount is reflected in the aggregated TaxesOutputs', () => {
  it('keeps TaxesOutputs and InvoiceTotals consistent with the discounted taxable base', () => {
    const discounted: DocumentDto = {
      ...esDomesticStandardInvoice,
      subtotal: 100000,
      discountTotal: 10000,
      vatAmount: 14940,
      amount: 104940,
      lineItems: [
        {
          id: 'line-1',
          name: 'Consultoría',
          quantity: '1',
          unitPrice: 60000,
          lineTotal: 60000,
          sortOrder: 0,
          vatRateBp: 2100,
          vatCategory: 'S',
          unitCode: null,
        },
        {
          id: 'line-2',
          name: 'Material',
          quantity: '1',
          unitPrice: 40000,
          lineTotal: 40000,
          sortOrder: 1,
          vatRateBp: 1000,
          vatCategory: 'S',
          unitCode: null,
        },
      ],
    };
    const xml = toFacturaeXml(discounted);

    const headerStart = xml.indexOf('<TaxesOutputs>');
    const headerEnd = xml.indexOf('</TaxesOutputs>');
    const headerBlock = xml.slice(headerStart, headerEnd);

    expect(headerBlock).toContain('<TaxableBase><TotalAmount>540.00</TotalAmount></TaxableBase>');
    expect(headerBlock).toContain('<TaxAmount><TotalAmount>113.40</TotalAmount></TaxAmount>');
    expect(headerBlock).toContain('<TaxableBase><TotalAmount>360.00</TotalAmount></TaxableBase>');
    expect(headerBlock).toContain('<TaxAmount><TotalAmount>36.00</TotalAmount></TaxAmount>');

    const taxableSum = [
      ...headerBlock.matchAll(/<TaxableBase><TotalAmount>([\d.]+)<\/TotalAmount>/g),
    ].reduce((sum, m) => sum + Number(m[1]), 0);
    const vatSum = [
      ...headerBlock.matchAll(/<TaxAmount><TotalAmount>([\d.]+)<\/TotalAmount>/g),
    ].reduce((sum, m) => sum + Number(m[1]), 0);

    expect(taxableSum.toFixed(2)).toBe('900.00');
    expect(vatSum.toFixed(2)).toBe('149.40');
    expect(xml).toContain('<TotalTaxOutputs>149.40</TotalTaxOutputs>');
    expect(xml).toContain('<InvoiceTotal>1049.40</InvoiceTotal>');
  });
});
