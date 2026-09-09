import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { esDomesticStandardInvoice } from './__fixtures__/es-domestic-standard';
import { checkFacturaeReadiness } from './facturae-readiness';

describe('checkFacturaeReadiness — fully populated ES fixture', () => {
  it('is ready', () => {
    expect(checkFacturaeReadiness(esDomesticStandardInvoice)).toEqual({
      ready: true,
      missingFields: [],
    });
  });
});

describe('checkFacturaeReadiness — out-of-scope document types', () => {
  it('flags proforma as not exportable', () => {
    const proforma: DocumentDto = { ...esDomesticStandardInvoice, documentType: 'proforma' };
    expect(checkFacturaeReadiness(proforma)).toEqual({
      ready: false,
      missingFields: ['document type must be an invoice, credit note or debit note'],
    });
  });
});

describe('checkFacturaeReadiness — issuance and party fields', () => {
  it('flags an unissued document', () => {
    const draft: DocumentDto = { ...esDomesticStandardInvoice, number: null, issuedAt: null };
    const result = checkFacturaeReadiness(draft);
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain('document number (document must be issued)');
    expect(result.missingFields).toContain('issue date');
  });

  it('flags a missing issuer street and postcode', () => {
    const incomplete: DocumentDto = {
      ...esDomesticStandardInvoice,
      issuer: { ...esDomesticStandardInvoice.issuer, street: null, postcode: null },
    };
    const result = checkFacturaeReadiness(incomplete);
    expect(result.missingFields).toContain('issuer street address');
    expect(result.missingFields).toContain('issuer postcode');
  });

  it('flags a missing recipient country', () => {
    const incomplete: DocumentDto = {
      ...esDomesticStandardInvoice,
      recipient: { ...esDomesticStandardInvoice.recipient, country: null },
    };
    expect(checkFacturaeReadiness(incomplete).missingFields).toContain('recipient country');
  });

  it('flags a missing tax identifier on both parties', () => {
    const incomplete: DocumentDto = {
      ...esDomesticStandardInvoice,
      issuer: { ...esDomesticStandardInvoice.issuer, eik: null, vatNumber: null },
      recipient: { ...esDomesticStandardInvoice.recipient, eik: null, vatNumber: null },
    };
    const result = checkFacturaeReadiness(incomplete);
    expect(result.missingFields).toContain('issuer NIF/CIF/NIE tax identifier');
    expect(result.missingFields).toContain('recipient NIF/CIF/NIE tax identifier');
  });

  it('flags an invalid CIF check character on the issuer', () => {
    const incomplete: DocumentDto = {
      ...esDomesticStandardInvoice,
      issuer: { ...esDomesticStandardInvoice.issuer, eik: 'B12345678' },
    };
    const result = checkFacturaeReadiness(incomplete);
    expect(result.ready).toBe(false);
    expect(
      result.missingFields.some((field) => field.startsWith('issuer tax identifier "B12345678"')),
    ).toBe(true);
  });

  it('accepts a bare NIF for a recipient acting as an individual', () => {
    const individual: DocumentDto = {
      ...esDomesticStandardInvoice,
      recipient: { ...esDomesticStandardInvoice.recipient, eik: '12345678Z', vatNumber: null },
    };
    const { missingFields } = checkFacturaeReadiness(individual);
    expect(missingFields.some((field) => field.startsWith('recipient tax identifier'))).toBe(false);
    expect(missingFields).not.toContain('recipient NIF/CIF/NIE tax identifier');
  });

  it('falls back to a stripped ES-prefixed VAT number when eik is absent', () => {
    const noEik: DocumentDto = {
      ...esDomesticStandardInvoice,
      recipient: { ...esDomesticStandardInvoice.recipient, eik: null, vatNumber: 'ESB00000018' },
    };
    expect(checkFacturaeReadiness(noEik).ready).toBe(true);
  });
});

describe('checkFacturaeReadiness — line items', () => {
  it('flags a document with no line items', () => {
    const incomplete: DocumentDto = { ...esDomesticStandardInvoice, lineItems: [] };
    expect(checkFacturaeReadiness(incomplete).missingFields).toContain('at least one line item');
  });
});
