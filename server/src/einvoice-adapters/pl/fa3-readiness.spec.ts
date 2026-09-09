import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
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
      missingFields: ['document type must be an invoice, credit note or debit note'],
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
    expect(result.missingFields).toContain('document number (document must be issued)');
    expect(result.missingFields).toContain('issue date');
  });

  it('flags a missing issuer street and postcode', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuer: { ...plDomesticStandardInvoice.issuer, street: null, postcode: null },
    };
    const result = checkFa3Readiness(incomplete);
    expect(result.missingFields).toContain('issuer street address');
    expect(result.missingFields).toContain('issuer postcode');
  });
});

describe('checkFa3Readiness — NIP validation', () => {
  it('flags a missing issuer NIP', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuer: { ...plDomesticStandardInvoice.issuer, vatNumber: null },
    };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      'issuer NIP (required for KSeF submission)',
    );
  });

  it('flags an issuer NIP that fails the checksum', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      issuer: { ...plDomesticStandardInvoice.issuer, vatNumber: 'PL1234563219' },
    };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      'issuer NIP fails the checksum validation',
    );
  });

  it('flags a missing recipient NIP for a domestic Polish buyer', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: { ...plDomesticStandardInvoice.recipient, vatNumber: null },
    };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      'recipient NIP (required for a domestic Polish buyer)',
    );
  });

  it('flags a recipient NIP that fails the checksum', () => {
    const incomplete: DocumentDto = {
      ...plDomesticStandardInvoice,
      recipient: { ...plDomesticStandardInvoice.recipient, vatNumber: 'PL1234563219' },
    };
    expect(checkFa3Readiness(incomplete).missingFields).toContain(
      'recipient NIP fails the checksum validation',
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
      'recipient NIP (required for a domestic Polish buyer)',
    );
  });
});

describe('checkFa3Readiness — line items', () => {
  it('flags a document with no line items', () => {
    const incomplete: DocumentDto = { ...plDomesticStandardInvoice, lineItems: [] };
    expect(checkFa3Readiness(incomplete).missingFields).toContain('at least one line item');
  });
});
