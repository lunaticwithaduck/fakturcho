import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { XRECHNUNG_CUSTOMIZATION_ID } from '../../einvoice-adapters/de/xrechnung-mapper';
import { bgDomesticStandardInvoice } from '../__fixtures__/bg-domestic-standard';
import { deDomesticStandardInvoice } from '../__fixtures__/eu-domestic-standard';
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
});

describe('selectEinvoiceReadinessCheck', () => {
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
    expect(result.missingFields).toContain('document number (document must be issued)');
  });
});
