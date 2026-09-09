import { describe, expect, it } from 'vitest';
import { deDomesticStandardInvoice } from '../../einvoice/__fixtures__/eu-domestic-standard';
import { deDomesticB2GInvoice } from './__fixtures__/de-domestic-b2g';
import { toXRechnungXml, XRECHNUNG_CUSTOMIZATION_ID } from './xrechnung-mapper';

describe('toXRechnungXml — DE domestic B2B invoice', () => {
  const xml = toXRechnungXml(deDomesticStandardInvoice);

  it('carries the XRechnung CustomizationID instead of the plain Peppol BIS one', () => {
    expect(xml).toContain(
      `<cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    );
  });

  it('carries the existing buyer reference untouched', () => {
    expect(xml).toContain('<cbc:BuyerReference>BESTELLUNG-55</cbc:BuyerReference>');
  });

  it('keeps the underlying EN 16931 UBL structure, including the 19% VAT line', () => {
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
    expect(xml).toContain(
      '<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19.00</cbc:Percent>',
    );
  });
});

describe('toXRechnungXml — DE B2G invoice with a Leitweg-ID', () => {
  const leitwegId = '04011000-1234512345-06';
  const xml = toXRechnungXml(deDomesticB2GInvoice, { leitwegId });

  it('carries the Leitweg-ID as the BuyerReference', () => {
    expect(xml).toContain(`<cbc:BuyerReference>${leitwegId}</cbc:BuyerReference>`);
  });

  it('does not duplicate BuyerReference', () => {
    const matches = xml.match(/<cbc:BuyerReference>/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('carries the XRechnung CustomizationID', () => {
    expect(xml).toContain(
      `<cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    );
  });
});

describe('toXRechnungXml — without a Leitweg-ID and no existing buyer reference', () => {
  it('omits BuyerReference entirely, same as the core mapper', () => {
    const xml = toXRechnungXml(deDomesticB2GInvoice);
    expect(xml).not.toContain('<cbc:BuyerReference>');
  });
});
