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

  it('does not emit CountrySubentity when no county option is supplied', () => {
    expect(xml).not.toContain('CountrySubentity');
  });
});

describe('toCiusRoXml — options: countyRegion (CountrySubentity)', () => {
  it('emits the issuer county on the supplier postal address in ISO 3166-2:RO form', () => {
    const xml = toCiusRoXml(roDomesticStandardInvoice, { issuerCountyRegion: 'B' });
    const customerPartyIndex = xml.indexOf('<cac:AccountingCustomerParty>');
    expect(xml.slice(0, customerPartyIndex)).toContain(
      '<cbc:CountrySubentity>RO-B</cbc:CountrySubentity><cac:Country>',
    );
    expect(xml.slice(customerPartyIndex)).not.toContain('CountrySubentity');
  });

  it('emits the recipient county on the customer postal address in ISO 3166-2:RO form', () => {
    const xml = toCiusRoXml(roDomesticStandardInvoice, { recipientCountyRegion: 'CJ' });
    const customerPartyIndex = xml.indexOf('<cac:AccountingCustomerParty>');
    expect(xml.slice(0, customerPartyIndex)).not.toContain('CountrySubentity');
    expect(xml.slice(customerPartyIndex)).toContain(
      '<cbc:CountrySubentity>RO-CJ</cbc:CountrySubentity><cac:Country>',
    );
  });

  it('emits both counties independently in their own party blocks', () => {
    const xml = toCiusRoXml(roDomesticStandardInvoice, {
      issuerCountyRegion: 'B',
      recipientCountyRegion: 'CJ',
    });
    const customerPartyIndex = xml.indexOf('<cac:AccountingCustomerParty>');
    expect(xml.slice(0, customerPartyIndex)).toContain(
      '<cbc:CountrySubentity>RO-B</cbc:CountrySubentity>',
    );
    expect(xml.slice(customerPartyIndex)).toContain(
      '<cbc:CountrySubentity>RO-CJ</cbc:CountrySubentity>',
    );
    expect(xml.slice(0, customerPartyIndex)).not.toContain('RO-CJ');
    expect(xml.slice(customerPartyIndex)).not.toContain('RO-B<');
  });

  it('does not double-prefix a county already given in ISO 3166-2:RO form', () => {
    const xml = toCiusRoXml(roDomesticStandardInvoice, { issuerCountyRegion: 'RO-CJ' });
    expect(xml).toContain('<cbc:CountrySubentity>RO-CJ</cbc:CountrySubentity>');
    expect(xml).not.toContain('RO-RO-CJ');
  });

  it('does not prefix a foreign party county with RO-', () => {
    const foreignRecipient: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: { ...roDomesticStandardInvoice.recipient, country: 'DE', vatNumber: null },
    };
    const xml = toCiusRoXml(foreignRecipient, { recipientCountyRegion: 'Bayern' });
    expect(xml).toContain('<cbc:CountrySubentity>Bayern</cbc:CountrySubentity>');
    expect(xml).not.toContain('RO-Bayern');
  });
});

describe('toCiusRoXml — PartyLegalEntity/CompanyID carries the bare CUI', () => {
  it('strips the RO prefix from the legal registration identifier of a VAT-registered issuer', () => {
    const prefixed: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, eik: 'RO18547290' },
    };
    const xml = toCiusRoXml(prefixed);
    const customerPartyIndex = xml.indexOf('<cac:AccountingCustomerParty>');
    const supplierSegment = xml.slice(0, customerPartyIndex);
    expect(supplierSegment).toContain(
      '<cac:PartyLegalEntity><cbc:RegistrationName>Exemplu Consulting SRL</cbc:RegistrationName><cbc:CompanyID>18547290</cbc:CompanyID></cac:PartyLegalEntity>',
    );
    // The VAT identifier keeps its RO prefix.
    expect(supplierSegment).toContain(
      '<cac:PartyTaxScheme><cbc:CompanyID>RO18547290</cbc:CompanyID>',
    );
  });

  it('strips the RO prefix from the legal registration identifier of a VAT-registered recipient', () => {
    const prefixed: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: { ...roDomesticStandardInvoice.recipient, eik: 'RO14399840' },
    };
    const xml = toCiusRoXml(prefixed);
    const customerPartyIndex = xml.indexOf('<cac:AccountingCustomerParty>');
    const customerSegment = xml.slice(customerPartyIndex);
    expect(customerSegment).toContain(
      '<cac:PartyLegalEntity><cbc:RegistrationName>Client Exemplu SA</cbc:RegistrationName><cbc:CompanyID>14399840</cbc:CompanyID></cac:PartyLegalEntity>',
    );
    expect(customerSegment).toContain(
      '<cac:PartyTaxScheme><cbc:CompanyID>RO14399840</cbc:CompanyID>',
    );
  });

  it('leaves a foreign party legal registration identifier unchanged', () => {
    const foreignRecipient: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: {
        ...roDomesticStandardInvoice.recipient,
        country: 'DE',
        vatNumber: 'DE123456789',
        eik: 'HRB 654321',
      },
    };
    expect(toCiusRoXml(foreignRecipient)).toContain(
      '<cbc:CompanyID>HRB 654321</cbc:CompanyID></cac:PartyLegalEntity>',
    );
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

  it('accepts an issuer eik carrying the same RO-prefixed value as its VAT number', () => {
    // A VAT-registered RO issuer's CUI field commonly holds the RO-prefixed
    // CIF, exactly like its vatNumber (see prod RO-31-inv-rc-issued: both
    // "RO18467557") — the checksum applies to the bare digits, not the raw
    // field value.
    const prefixed: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, eik: 'RO18547290' },
    };
    expect(() => toCiusRoXml(prefixed)).not.toThrow();
  });

  it('accepts a recipient eik carrying the same RO-prefixed value as its VAT number', () => {
    const prefixed: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: { ...roDomesticStandardInvoice.recipient, eik: 'RO14399840' },
    };
    expect(() => toCiusRoXml(prefixed)).not.toThrow();
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

describe('toCiusRoXml — automatic EU B2B reverse charge (no user-set ground)', () => {
  it('derives the Romanian "Taxare inversă" wording instead of the generic VATEX fallback', () => {
    const [line] = roDomesticStandardInvoice.lineItems;
    if (!line) throw new Error('expected fixture to carry a line item');
    // resolveLineVatCategory sets AE automatically; nothing asks the issuer
    // for a ground, so a real reverse-charge document keeps
    // vatExemptionGround null (see prod RO-31-inv-rc-issued).
    const reverseCharge: DocumentDto = {
      ...roDomesticStandardInvoice,
      vatExemptionGround: null,
      vatRateBp: 0,
      vatAmount: 0,
      amount: roDomesticStandardInvoice.subtotal,
      recipient: {
        ...roDomesticStandardInvoice.recipient,
        country: 'DE',
        vatNumber: 'DE123456788',
      },
      lineItems: [{ ...line, vatRateBp: 0, vatCategory: 'AE' }],
    };
    const xml = toCiusRoXml(reverseCharge);
    expect(xml).toContain('<cbc:TaxExemptionReasonCode>VATEX-EU-AE</cbc:TaxExemptionReasonCode>');
    expect(xml).toContain('<cbc:TaxExemptionReason>Taxare inversă</cbc:TaxExemptionReason>');
    expect(xml).not.toContain('Reverse charge');
  });
});

describe('toCiusRoXml — correction reason', () => {
  it('inherits the header cbc:Note carrying the correction reason from the core mapper', () => {
    const creditNote: DocumentDto = {
      ...roDomesticStandardInvoice,
      documentType: 'credit_note',
      originalDocumentId: 'doc-ro-domestic-1',
      correctionReason: 'Marfă returnată',
    };
    expect(toCiusRoXml(creditNote)).toContain(
      '<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode><cbc:Note>Marfă returnată</cbc:Note>',
    );
  });
});

describe('toCiusRoXml — out-of-scope document types', () => {
  it('throws for proforma, delegating to the core mapper', () => {
    const proforma: DocumentDto = { ...roDomesticStandardInvoice, documentType: 'proforma' };
    expect(() => toCiusRoXml(proforma)).toThrow();
  });
});

describe('toCiusRoXml — inherits the discount-adjusted VAT breakdown from the core mapper', () => {
  it('does not double count VAT when the document carries a discount', () => {
    const discounted: DocumentDto = {
      ...roDomesticStandardInvoice,
      subtotal: 100000,
      discountTotal: 10000,
      vatAmount: 17100,
      amount: 107100,
      lineItems: [
        {
          id: 'line-1',
          name: 'Consultanță',
          quantity: '1',
          unitPrice: 100000,
          lineTotal: 100000,
          sortOrder: 0,
          vatRateBp: 1900,
          vatCategory: 'S',
          unitCode: null,
        },
      ],
    };
    const xml = toCiusRoXml(discounted);
    expect(xml).toContain('<cbc:TaxableAmount currencyID="EUR">900.00</cbc:TaxableAmount>');
    expect(xml).toContain('<cbc:TaxAmount currencyID="EUR">171.00</cbc:TaxAmount>');
  });
});

describe('toCiusRoXml — Bucharest sector city (BR-RO-100)', () => {
  it('names the sector as the city for a Bucharest issuer when the address gives it', () => {
    const document = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, city: 'București, Sector 3' },
    };
    const xml = toCiusRoXml(document, { issuerCountyRegion: 'București' });
    const supplier = xml.slice(0, xml.indexOf('<cac:AccountingCustomerParty>'));
    expect(supplier).toContain('<cbc:CityName>SECTOR3</cbc:CityName>');
    expect(supplier).toContain('<cbc:CountrySubentity>RO-B</cbc:CountrySubentity>');
  });

  it('leaves the city as entered when no sector is given', () => {
    const xml = toCiusRoXml(roDomesticStandardInvoice, { issuerCountyRegion: 'B' });
    expect(xml).toContain('<cbc:CityName>București</cbc:CityName>');
  });
});
