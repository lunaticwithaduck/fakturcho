import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { itDomesticStandardInvoice } from './__fixtures__/it-domestic-standard';
import {
  checkFatturaPaReadiness,
  isValidCodiceFiscale,
  isValidPartitaIva,
} from './fatturapa-readiness';

const CODICE_DESTINATARIO_MESSAGE =
  'Codice Destinatario (7-character SDI recipient channel code) or recipient PEC email — not yet modeled on DocumentDto/Client';

describe('isValidPartitaIva', () => {
  it('accepts a valid 11-digit Partita IVA', () => {
    expect(isValidPartitaIva('01234567897')).toBe(true);
  });

  it('accepts a valid Partita IVA with the IT country prefix', () => {
    expect(isValidPartitaIva('IT01234567897')).toBe(true);
  });

  it('rejects a Partita IVA with a wrong check digit', () => {
    expect(isValidPartitaIva('01234567898')).toBe(false);
  });

  it('rejects a Partita IVA of the wrong length', () => {
    expect(isValidPartitaIva('0123456789')).toBe(false);
  });
});

describe('isValidCodiceFiscale', () => {
  it('accepts a company Codice Fiscale that passes the numeric checksum', () => {
    expect(isValidCodiceFiscale('01234567897')).toBe(true);
  });

  it('accepts a well-formed 16-character personal Codice Fiscale', () => {
    expect(isValidCodiceFiscale('RSSMRA85M01H501Z')).toBe(true);
  });

  it('rejects a malformed personal Codice Fiscale', () => {
    expect(isValidCodiceFiscale('RSSMRA85M01H50')).toBe(false);
  });
});

describe('checkFatturaPaReadiness — the golden IT domestic fixture', () => {
  it('flags only the not-yet-modeled Codice Destinatario / PEC field', () => {
    expect(checkFatturaPaReadiness(itDomesticStandardInvoice)).toEqual({
      ready: false,
      missingFields: [CODICE_DESTINATARIO_MESSAGE],
    });
  });
});

describe('checkFatturaPaReadiness — out-of-scope document types', () => {
  it('flags proforma as not exportable', () => {
    const proforma: DocumentDto = { ...itDomesticStandardInvoice, documentType: 'proforma' };
    expect(checkFatturaPaReadiness(proforma)).toEqual({
      ready: false,
      missingFields: ['document type must be an invoice, credit note or debit note'],
    });
  });

  it('flags quote as not exportable', () => {
    const quote: DocumentDto = { ...itDomesticStandardInvoice, documentType: 'quote' };
    expect(checkFatturaPaReadiness(quote).ready).toBe(false);
  });
});

describe('checkFatturaPaReadiness — Partita IVA and Codice Fiscale checks', () => {
  it('flags a missing issuer Partita IVA', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, vatNumber: null },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      'issuer Partita IVA (VAT number)',
    );
  });

  it('flags an invalid issuer Partita IVA checksum', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, vatNumber: 'IT01234567898' },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      'issuer Partita IVA is not a valid Italian VAT number',
    );
  });

  it('flags a missing issuer Codice Fiscale', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, eik: null },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain('issuer Codice Fiscale');
  });

  it('flags a missing recipient Partita IVA and Codice Fiscale together', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, vatNumber: null, eik: null },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      'recipient Partita IVA or Codice Fiscale',
    );
  });

  it('flags an invalid recipient Codice Fiscale format', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, eik: 'not-a-codice-fiscale' },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      'recipient Codice Fiscale is not a valid format',
    );
  });
});

describe('checkFatturaPaReadiness — required parties and line items', () => {
  it('flags a missing issuer company name', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, companyName: null },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain('issuer company name');
  });

  it('flags a document with no line items', () => {
    const document: DocumentDto = { ...itDomesticStandardInvoice, lineItems: [] };
    expect(checkFatturaPaReadiness(document).missingFields).toContain('at least one line item');
  });
});
