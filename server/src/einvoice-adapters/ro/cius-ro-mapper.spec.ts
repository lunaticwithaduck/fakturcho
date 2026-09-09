import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { roDomesticStandardInvoice } from './__fixtures__/ro-domestic-standard';
import { toCiusRoXml } from './cius-ro-mapper';

describe('toCiusRoXml — RO domestic, standard rate', () => {
  const xml = toCiusRoXml(roDomesticStandardInvoice);

  it('starts with an XML declaration and a single Invoice root', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Invoice')).toBe(true);
    expect(xml.endsWith('</Invoice>')).toBe(true);
  });

  it('carries the CIUS-RO customization and profile identifiers, not the Peppol ones', () => {
    expect(xml).toContain(
      '<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>',
    );
    expect(xml).toContain('<cbc:ProfileID>urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:ProfileID>');
    expect(xml).not.toContain('poacc:billing');
  });

  it('carries document type code 380 and RO country codes for both parties', () => {
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cbc:IdentificationCode>RO</cbc:IdentificationCode>');
  });

  it('carries the RO-prefixed VAT numbers for both parties', () => {
    expect(xml).toContain('<cac:PartyTaxScheme><cbc:CompanyID>RO18547290</cbc:CompanyID>');
    expect(xml).toContain('<cac:PartyTaxScheme><cbc:CompanyID>RO14399840</cbc:CompanyID>');
  });

  it('carries the 19% Romanian standard VAT rate on the line item', () => {
    expect(xml).toContain(
      '<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19.00</cbc:Percent>',
    );
  });

  it('carries issuer and recipient party names', () => {
    expect(xml).toContain('<cbc:RegistrationName>Exemplu Consulting SRL</cbc:RegistrationName>');
    expect(xml).toContain('<cbc:RegistrationName>Client Exemplu SA</cbc:RegistrationName>');
  });
});

describe('toCiusRoXml — Romanian CUI/VAT validation', () => {
  it('throws when the issuer VAT number fails the Romanian checksum', () => {
    const invalid: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, vatNumber: 'RO18547291' },
    };
    expect(() => toCiusRoXml(invalid)).toThrow(/CUI/);
  });

  it('throws when the issuer registration identifier is not a valid CUI', () => {
    const invalid: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, eik: '18547291' },
    };
    expect(() => toCiusRoXml(invalid)).toThrow(/CUI/);
  });

  it('throws when the recipient VAT number fails the Romanian checksum', () => {
    const invalid: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: { ...roDomesticStandardInvoice.recipient, vatNumber: 'RO14399841' },
    };
    expect(() => toCiusRoXml(invalid)).toThrow(/CUI/);
  });

  it('throws when the recipient registration identifier is not a valid CUI', () => {
    const invalid: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: { ...roDomesticStandardInvoice.recipient, eik: '14399841' },
    };
    expect(() => toCiusRoXml(invalid)).toThrow(/CUI/);
  });

  it('does not validate CUI format for a non-Romanian party', () => {
    const notRomanian: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: {
        ...roDomesticStandardInvoice.recipient,
        country: 'DE',
        vatNumber: 'DE123456789',
        eik: 'HRB 654321',
      },
    };
    expect(() => toCiusRoXml(notRomanian)).not.toThrow();
  });
});

describe('toCiusRoXml — out-of-scope document types', () => {
  it('throws for proforma, delegating to the core mapper', () => {
    const proforma: DocumentDto = { ...roDomesticStandardInvoice, documentType: 'proforma' };
    expect(() => toCiusRoXml(proforma)).toThrow();
  });
});
