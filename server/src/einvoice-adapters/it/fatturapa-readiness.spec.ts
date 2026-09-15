import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { EINVOICE_MISSING_FIELD_CODES } from '../../einvoice/readiness';
import { itDomesticStandardInvoice } from './__fixtures__/it-domestic-standard';
import {
  checkFatturaPaReadiness,
  isValidCodiceFiscale,
  isValidPartitaIva,
} from './fatturapa-readiness';

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
  it('flags only the not-yet-modeled Codice Destinatario / PEC field when no options are supplied', () => {
    expect(checkFatturaPaReadiness(itDomesticStandardInvoice)).toEqual({
      ready: false,
      missingFields: [EINVOICE_MISSING_FIELD_CODES.recipientSdiCodeOrPec],
    });
  });

  it('is ready when an SDI recipient code is supplied via options', () => {
    expect(
      checkFatturaPaReadiness(itDomesticStandardInvoice, { sdiRecipientCode: 'ABC1234' }),
    ).toEqual({
      ready: true,
      missingFields: [],
    });
  });

  it('is ready when a recipient PEC address is supplied via options', () => {
    expect(
      checkFatturaPaReadiness(itDomesticStandardInvoice, {
        pec: 'fatture@bianchi.legalmail.it',
      }),
    ).toEqual({
      ready: true,
      missingFields: [],
    });
  });
});

describe('checkFatturaPaReadiness — out-of-scope document types', () => {
  it('flags proforma as not exportable', () => {
    const proforma: DocumentDto = { ...itDomesticStandardInvoice, documentType: 'proforma' };
    expect(checkFatturaPaReadiness(proforma)).toEqual({
      ready: false,
      missingFields: [EINVOICE_MISSING_FIELD_CODES.documentType],
    });
  });

  it('flags quote as not exportable', () => {
    const quote: DocumentDto = { ...itDomesticStandardInvoice, documentType: 'quote' };
    expect(checkFatturaPaReadiness(quote).ready).toBe(false);
  });

  it('flags delivery_note as not exportable, even with transport fields set', () => {
    const deliveryNote: DocumentDto = {
      ...itDomesticStandardInvoice,
      documentType: 'delivery_note',
      transportReason: 'Vendita',
      transportedAt: '2026-09-15T09:00:00.000Z',
    };
    expect(checkFatturaPaReadiness(deliveryNote)).toEqual({
      ready: false,
      missingFields: [EINVOICE_MISSING_FIELD_CODES.documentType],
    });
  });
});

describe('checkFatturaPaReadiness — Partita IVA and Codice Fiscale checks', () => {
  it('flags a missing issuer Partita IVA', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, vatNumber: null },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerPartitaIva,
    );
  });

  it('flags an invalid issuer Partita IVA checksum', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, vatNumber: 'IT01234567898' },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerPartitaIvaInvalid,
    );
  });

  it('flags a missing issuer Codice Fiscale', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, eik: null },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerCodiceFiscale,
    );
  });

  it('flags a missing recipient Partita IVA and Codice Fiscale together', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, vatNumber: null, eik: null },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.recipientPartitaIvaOrCodiceFiscale,
    );
  });

  it('flags an invalid recipient Codice Fiscale format', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, eik: 'not-a-codice-fiscale' },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.recipientCodiceFiscaleInvalid,
    );
  });
});

describe('checkFatturaPaReadiness — required parties and line items', () => {
  it('flags a missing issuer company name', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, companyName: null },
    };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.issuerCompanyName,
    );
  });

  it('flags a document with no line items', () => {
    const document: DocumentDto = { ...itDomesticStandardInvoice, lineItems: [] };
    expect(checkFatturaPaReadiness(document).missingFields).toContain(
      EINVOICE_MISSING_FIELD_CODES.documentLineItems,
    );
  });
});
