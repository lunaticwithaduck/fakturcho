import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { XRECHNUNG_CUSTOMIZATION_ID } from '../../einvoice-adapters/de/xrechnung-mapper';
import { itDomesticStandardInvoice } from '../../einvoice-adapters/it/__fixtures__/it-domestic-standard';
import { roDomesticStandardInvoice } from '../../einvoice-adapters/ro/__fixtures__/ro-domestic-standard';
import { bgDomesticStandardInvoice } from '../__fixtures__/bg-domestic-standard';
import { deDomesticStandardInvoice } from '../__fixtures__/eu-domestic-standard';
import { EINVOICE_MISSING_FIELD_CODES } from '../readiness';
import { selectEinvoiceReadinessCheck, selectEinvoiceXmlMapper } from './einvoice-mapper-selection';

describe('selectEinvoiceXmlMapper', () => {
  it('maps a BG-issuer document through the core UBL mapper', () => {
    const xml = selectEinvoiceXmlMapper(bgDomesticStandardInvoice.issuer.country)(
      bgDomesticStandardInvoice,
    );
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Invoice')).toBe(true);
    expect(xml).not.toContain(XRECHNUNG_CUSTOMIZATION_ID);
  });

  it('maps a DE-issuer document through the XRechnung adapter', () => {
    const xml = selectEinvoiceXmlMapper(deDomesticStandardInvoice.issuer.country)(
      deDomesticStandardInvoice,
    );
    expect(xml).toContain(
      `<cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    );
  });

  it('falls back to the core mapper for a country with no adapter, including BG explicitly', () => {
    expect(selectEinvoiceXmlMapper('BG')).toBe(selectEinvoiceXmlMapper(null));
  });

  it('is case-insensitive on the issuer country code', () => {
    const xml = selectEinvoiceXmlMapper('de')(deDomesticStandardInvoice);
    expect(xml).toContain(
      `<cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    );
  });

  it('tolerates surrounding whitespace on the issuer country code', () => {
    const xml = selectEinvoiceXmlMapper(' DE ')(deDomesticStandardInvoice);
    expect(xml).toContain(
      `<cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    );
  });

  it('falls back to the core mapper for a non-EU country', () => {
    expect(selectEinvoiceXmlMapper('US')).toBe(selectEinvoiceXmlMapper(null));
  });

  it('maps a RO-issuer document with no countyRegion set exactly as the bare CIUS-RO adapter would', () => {
    const xml = selectEinvoiceXmlMapper(roDomesticStandardInvoice.issuer.country)(
      roDomesticStandardInvoice,
    );
    expect(xml).not.toContain('CountrySubentity');
  });

  it('threads issuer and recipient countyRegion from the document into the CIUS-RO adapter', () => {
    const document: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, countyRegion: 'București' },
      recipient: { ...roDomesticStandardInvoice.recipient, countyRegion: 'Cluj' },
    };
    const xml = selectEinvoiceXmlMapper(document.issuer.country)(document);
    const customerPartyIndex = xml.indexOf('<cac:AccountingCustomerParty>');
    expect(xml.slice(0, customerPartyIndex)).toContain(
      '<cbc:CountrySubentity>București</cbc:CountrySubentity><cac:Country>',
    );
    expect(xml.slice(customerPartyIndex)).toContain(
      '<cbc:CountrySubentity>Cluj</cbc:CountrySubentity><cac:Country>',
    );
  });

  it('maps an IT-issuer document with no sdiRecipientCode/pec set exactly as the bare FatturaPA adapter would', () => {
    const xml = selectEinvoiceXmlMapper(itDomesticStandardInvoice.issuer.country)(
      itDomesticStandardInvoice,
    );
    expect(xml).toContain('<CodiceDestinatario>0000000</CodiceDestinatario>');
    expect(xml).not.toContain('<PECDestinatario>');
  });

  it('threads the recipient sdiRecipientCode from the document into the FatturaPA adapter', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, sdiRecipientCode: 'ABC1234' },
    };
    const xml = selectEinvoiceXmlMapper(document.issuer.country)(document);
    expect(xml).toContain('<CodiceDestinatario>ABC1234</CodiceDestinatario>');
    expect(xml).not.toContain('<PECDestinatario>');
  });

  it('threads the recipient pec from the document into the FatturaPA adapter when no SDI code is set', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, pec: 'fatture@bianchi.legalmail.it' },
    };
    const xml = selectEinvoiceXmlMapper(document.issuer.country)(document);
    expect(xml).toContain('<CodiceDestinatario>0000000</CodiceDestinatario>');
    expect(xml).toContain('<PECDestinatario>fatture@bianchi.legalmail.it</PECDestinatario>');
  });
});

describe('selectEinvoiceReadinessCheck', () => {
  it('is case-insensitive on the issuer country code', () => {
    const result = selectEinvoiceReadinessCheck('de')(deDomesticStandardInvoice);
    expect(result.ready).toBe(true);
  });

  it('is ready for the fully populated BG fixture', () => {
    const result = selectEinvoiceReadinessCheck(bgDomesticStandardInvoice.issuer.country)(
      bgDomesticStandardInvoice,
    );
    expect(result).toEqual({ ready: true, missingFields: [] });
  });

  it('is ready for the fully populated DE fixture via the XRechnung readiness check', () => {
    const result = selectEinvoiceReadinessCheck(deDomesticStandardInvoice.issuer.country)(
      deDomesticStandardInvoice,
    );
    expect(result.ready).toBe(true);
  });

  it('flags a not-ready document consistently regardless of country selection', () => {
    const unissued: DocumentDto = {
      ...bgDomesticStandardInvoice,
      number: null,
      issuedAt: null,
    };
    const result = selectEinvoiceReadinessCheck(unissued.issuer.country)(unissued);
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.documentNumber);
  });

  it('flags both counties as missing for a RO document with no countyRegion set, matching the bare adapter', () => {
    const result = selectEinvoiceReadinessCheck(roDomesticStandardInvoice.issuer.country)(
      roDomesticStandardInvoice,
    );
    expect(result).toEqual({
      ready: false,
      missingFields: [
        EINVOICE_MISSING_FIELD_CODES.issuerCountyRegion,
        EINVOICE_MISSING_FIELD_CODES.recipientCountyRegion,
      ],
    });
  });

  it('no longer flags county as missing once the document carries issuer and recipient countyRegion', () => {
    const document: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, countyRegion: 'București' },
      recipient: { ...roDomesticStandardInvoice.recipient, countyRegion: 'Cluj' },
    };
    const result = selectEinvoiceReadinessCheck(document.issuer.country)(document);
    expect(result.missingFields).not.toContain(EINVOICE_MISSING_FIELD_CODES.issuerCountyRegion);
    expect(result.missingFields).not.toContain(EINVOICE_MISSING_FIELD_CODES.recipientCountyRegion);
  });

  it('flags the SDI/PEC field as missing for an IT document with neither set, matching the bare adapter', () => {
    const result = selectEinvoiceReadinessCheck(itDomesticStandardInvoice.issuer.country)(
      itDomesticStandardInvoice,
    );
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.recipientSdiCodeOrPec);
  });

  it('no longer flags SDI/PEC as missing once the document carries a recipient sdiRecipientCode', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, sdiRecipientCode: 'ABC1234' },
    };
    const result = selectEinvoiceReadinessCheck(document.issuer.country)(document);
    expect(result).toEqual({ ready: true, missingFields: [] });
  });

  it('no longer flags SDI/PEC as missing once the document carries a recipient pec', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, pec: 'fatture@bianchi.legalmail.it' },
    };
    const result = selectEinvoiceReadinessCheck(document.issuer.country)(document);
    expect(result).toEqual({ ready: true, missingFields: [] });
  });
});
