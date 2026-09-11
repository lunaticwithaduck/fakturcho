import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { EINVOICE_MISSING_FIELD_CODES } from '../../einvoice/readiness';
import { plDomesticStandardInvoice } from './__fixtures__/pl-domestic-standard';
import { checkFa3Readiness } from './fa3-readiness';

describe('checkFa3Readiness — fully populated fixture', () => {
  it('is ready for the PL domestic standard-rate fixture', () => {
    expect(checkFa3Readiness(plDomesticStandardInvoice)).toEqual({
      ready: true,
      missingFields: [],
    });
  });
});

describe('checkFa3Readiness — out-of-scope document types', () => {
  it('flags proforma as not exportable', () => {
    const proforma: DocumentDto = { ...plDomesticStandardInvoice, documentType: 'proforma' };
    expect(checkFa3Readiness(proforma)).toEqual({
      ready: false,
      missingFields: [EINVOICE_MISSING_FIELD_CODES.documentType],
    });
  });

  it('flags quote as not exportable', () => {
    const quote: DocumentDto = { ...plDomesticStandardInvoice, documentType: 'quote' };
    expect(checkFa3Readiness(quote).ready).toBe(false);
  });
});

describe('checkFa3Readiness — issuance and party fields', () => {
  it('flags an unissued document', () => {
    const draft: DocumentDto = { ...plDomesticStandardInvoice, number: null, issuedAt: null };
    const result = checkFa3Readiness(draft);
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.documentNumber);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.documentIssuedAt);
  });

  it('flags a missing issuer street and postcode', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuer: { ...plDomesticStandardInvoice.issuer, street: null, postcode: null },
    };
    const result = checkFa3Readiness(incomplete);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.issuerStreet);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.issuerPostcode);
  });
});

describe('checkFa3Readiness — NIP validation', () => {
  it('flags a missing issuer NIP', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuer: { ...plDomesticStandardInvoice.issuer, vatNumber: null },
    };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerNip,
    );
  });

  it('flags an issuer NIP that fails the checksum', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuer: { ...plDomesticStandardInvoice.issuer, vatNumber: 'PL1234563219' },
    };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerNipChecksum,
    );
  });

  it('flags a missing recipient NIP for a domestic Polish buyer', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: { ...plDomesticStandardInvoice.recipient, vatNumber: null },
    };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.recipientNip,
    );
  });

  it('flags a recipient NIP that fails the checksum', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: { ...plDomesticStandardInvoice.recipient, vatNumber: 'PL1234563219' },
    };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.recipientNipChecksum,
    );
  });

  it('does not require a recipient NIP for a foreign buyer', () => {
    const foreignBuyer: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: {
        ...plDomesticStandardInvoice.recipient,
        country: 'DE',
        vatNumber: 'DE123456789',
      },
    };
    expect(checkFa3Readiness(foreignBuyer).missingFields).not.toContain(
      EINVOICE_MISSING_FIELD_CODES.recipientNip,
    );
  });
});

describe('checkFa3Readiness — line items', () => {
  it('flags a document with no line items', () => {
    const incomplete: DocumentDto = { ...plDomesticStandardInvoice, lineItems: [] };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.documentLineItems,
    );
  });
});
