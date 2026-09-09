import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { deDomesticStandardInvoice } from '../../einvoice/__fixtures__/eu-domestic-standard';
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
      'issuer phone number (XRechnung requires a seller contact channel, per BR-DE-2)',
    );
  });

  it('flags a missing IBAN for a credit-transfer payment means', () => {
    const incomplete: DocumentDto = {
      ...deDomesticStandardInvoice,
      issuer: { ...deDomesticStandardInvoice.issuer, iban: null },
    };
    expect(checkXRechnungReadiness(incomplete).missingFields).toContain(
      'issuer IBAN (required for the selected credit transfer payment means, per BR-DE-18)',
    );
  });

  it('flags a missing legal registration when both VAT number and eik are absent', () => {
    const incomplete: DocumentDto = {
      ...deDomesticStandardInvoice,
      issuer: { ...deDomesticStandardInvoice.issuer, vatNumber: null, eik: null },
    };
    expect(checkXRechnungReadiness(incomplete).missingFields).toContain(
      'issuer VAT number or legal registration id (per BR-DE-4/BR-DE-5)',
    );
  });
});

describe('checkXRechnungReadiness — DE B2G fixture', () => {
  it('flags a missing buyer reference / Leitweg-ID when neither is present', () => {
    expect(checkXRechnungReadiness(deDomesticB2GInvoice).missingFields).toContain(
      'buyer reference or Leitweg-ID (XRechnung requires one, per BR-DE-1)',
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
    expect(result.missingFields).toContain(
      'Leitweg-ID does not match the routing-id/sub-id/checksum format',
    );
  });
});
