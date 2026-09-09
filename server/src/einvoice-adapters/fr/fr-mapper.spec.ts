import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { frDomesticStandardInvoice } from './__fixtures__/fr-domestic-standard';
import { FrenchMappingError, toFrenchUblXml } from './fr-mapper';

describe('toFrenchUblXml — FR domestic, standard rate', () => {
  const xml = toFrenchUblXml(frDomesticStandardInvoice);

  it('produces the same UBL envelope as the core mapper', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Invoice')).toBe(true);
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>');
  });

  it('carries the standard 20% VAT category', () => {
    expect(xml).toContain(
      '<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20.00</cbc:Percent>',
    );
  });

  it('layers the issuer SIRET as a PartyIdentification under the Peppol SIRET scheme', () => {
    expect(xml).toContain(
      '<cac:AccountingSupplierParty><cac:Party><cac:PartyIdentification>' +
        '<cbc:ID schemeID="0009">39442600100019</cbc:ID></cac:PartyIdentification>',
    );
  });

  it('layers the recipient SIREN as a PartyIdentification under the Peppol SIRENE scheme', () => {
    expect(xml).toContain(
      '<cac:AccountingCustomerParty><cac:Party><cac:PartyIdentification>' +
        '<cbc:ID schemeID="0002">394426019</cbc:ID></cac:PartyIdentification>',
    );
  });

  it('still carries the French VAT numbers via the core PartyTaxScheme mapping', () => {
    expect(xml).toContain('<cac:PartyTaxScheme><cbc:CompanyID>FR40394426001</cbc:CompanyID>');
    expect(xml).toContain('<cac:PartyTaxScheme><cbc:CompanyID>FR71394426019</cbc:CompanyID>');
  });
});

describe('toFrenchUblXml — validation', () => {
  it('throws when the FR issuer has no valid SIREN or SIRET', () => {
    const invalid: DocumentDto = {
      ...frDomesticStandardInvoice,
      issuer: { ...frDomesticStandardInvoice.issuer, eik: 'not-a-siret' },
    };
    expect(() => toFrenchUblXml(invalid)).toThrow(FrenchMappingError);
  });

  it('throws when the FR recipient has no valid SIREN or SIRET', () => {
    const invalid: DocumentDto = {
      ...frDomesticStandardInvoice,
      recipient: { ...frDomesticStandardInvoice.recipient, eik: '123' },
    };
    expect(() => toFrenchUblXml(invalid)).toThrow(FrenchMappingError);
  });

  it('throws when the FR issuer VAT number is not in the FR + 11 characters format', () => {
    const invalid: DocumentDto = {
      ...frDomesticStandardInvoice,
      issuer: { ...frDomesticStandardInvoice.issuer, vatNumber: 'BE0123456789' },
    };
    expect(() => toFrenchUblXml(invalid)).toThrow(FrenchMappingError);
  });

  it('does not require FR identifiers from a non-FR party', () => {
    const crossBorder: DocumentDto = {
      ...frDomesticStandardInvoice,
      recipient: {
        ...frDomesticStandardInvoice.recipient,
        country: 'DE',
        eik: null,
        vatNumber: 'DE123456789',
      },
    };
    expect(() => toFrenchUblXml(crossBorder)).not.toThrow();
    const xml = toFrenchUblXml(crossBorder);
    expect(xml).toContain('<cbc:IdentificationCode>DE</cbc:IdentificationCode>');
  });
});
