import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { deDomesticStandardInvoice } from '../../einvoice/__fixtures__/eu-domestic-standard';
import { EINVOICE_MISSING_FIELD_CODES } from '../../einvoice/readiness';
import { deDomesticB2GInvoice } from './__fixtures__/de-domestic-b2g';
import { checkXRechnungReadiness } from './xrechnung-readiness';

describe('checkXRechnungReadiness — DE domestic B2B fixture', () => {
  it('is ready as-is', () => {
    expect(checkXRechnungReadiness(deDomesticStandardInvoice)).toEqual({
      ready: true,
      missingFields: [],
    });
  });

  it('flags a missing issuer phone', () => {
    const incomplete: DocumentDto = {
      ...deDomesticStandardInvoice,
      issuer: { ...deDomesticStandardInvoice.issuer, phone: null },
    };
    expect(checkXRechnungReadiness(incomplete).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerPhone,
    );
  });

  it('flags a missing IBAN for a credit-transfer payment means', () => {
    const incomplete: DocumentDto = {
      ...deDomesticStandardInvoice,
      issuer: { ...deDomesticStandardInvoice.issuer, iban: null },
    };
    expect(checkXRechnungReadiness(incomplete).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerIban,
    );
  });

  it('flags a missing legal registration when both VAT number and eik are absent', () => {
    const incomplete: DocumentDto = {
      ...deDomesticStandardInvoice,
      issuer: { ...deDomesticStandardInvoice.issuer, vatNumber: null, eik: null },
    };
    expect(checkXRechnungReadiness(incomplete).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerVatNumberOrRegistrationId,
    );
  });
});

describe('checkXRechnungReadiness — DE B2G fixture', () => {
  it('flags a missing buyer reference / Leitweg-ID when neither is present', () => {
    expect(checkXRechnungReadiness(deDomesticB2GInvoice).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.documentBuyerReferenceOrLeitwegId,
    );
  });

  it('is ready once a well-formed Leitweg-ID is supplied', () => {
    const result = checkXRechnungReadiness(deDomesticB2GInvoice, {
      leitwegId: '04011000-1234512345-06',
    });
    expect(result).toEqual({ ready: true, missingFields: [] });
  });

  it('flags a malformed Leitweg-ID', () => {
    const result = checkXRechnungReadiness(deDomesticB2GInvoice, {
      leitwegId: 'not-a-leitweg-id',
    });
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.documentLeitwegIdFormat);
  });
});
