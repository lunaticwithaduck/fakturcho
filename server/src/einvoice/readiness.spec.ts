import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { bgDomesticStandardInvoice } from './__fixtures__/bg-domestic-standard';
import { deDomesticStandardInvoice } from './__fixtures__/eu-domestic-standard';
import { bgToEuReverseChargeInvoice } from './__fixtures__/eu-reverse-charge';
import { checkEinvoiceReadiness } from './readiness';

describe('checkEinvoiceReadiness — fully populated fixtures', () => {
  it('is ready for the BG domestic standard-rate fixture', () => {
    expect(checkEinvoiceReadiness(bgDomesticStandardInvoice)).toEqual({
      ready: true,
      missingFields: [],
    });
  });

  it('is ready for the BG-to-DE reverse charge fixture', () => {
    expect(checkEinvoiceReadiness(bgToEuReverseChargeInvoice)).toEqual({
      ready: true,
      missingFields: [],
    });
  });

  it('is ready for the DE domestic standard-rate fixture', () => {
    expect(checkEinvoiceReadiness(deDomesticStandardInvoice)).toEqual({
      ready: true,
      missingFields: [],
    });
  });
});

describe('checkEinvoiceReadiness — out-of-scope document types', () => {
  it('flags proforma as not exportable', () => {
    const proforma: DocumentDto = { ...bgDomesticStandardInvoice, documentType: 'proforma' };
    expect(checkEinvoiceReadiness(proforma)).toEqual({
      ready: false,
      missingFields: ['document type must be an invoice, credit note or debit note'],
    });
  });

  it('flags quote as not exportable', () => {
    const quote: DocumentDto = { ...bgDomesticStandardInvoice, documentType: 'quote' };
    expect(checkEinvoiceReadiness(quote).ready).toBe(false);
  });
});

describe('checkEinvoiceReadiness — issuance and party fields', () => {
  it('flags an unissued document', () => {
    const draft: DocumentDto = { ...bgDomesticStandardInvoice, number: null, issuedAt: null };
    const result = checkEinvoiceReadiness(draft);
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain('document number (document must be issued)');
    expect(result.missingFields).toContain('issue date');
  });

  it('flags a missing issuer street and postcode', () => {
    const incomplete: DocumentDto = {
      ...bgDomesticStandardInvoice,
      issuer: { ...bgDomesticStandardInvoice.issuer, street: null, postcode: null },
    };
    const result = checkEinvoiceReadiness(incomplete);
    expect(result.missingFields).toContain('issuer street address');
    expect(result.missingFields).toContain('issuer postcode');
  });

  it('flags a missing recipient country', () => {
    const incomplete: DocumentDto = {
      ...bgDomesticStandardInvoice,
      recipient: { ...bgDomesticStandardInvoice.recipient, country: null },
    };
    expect(checkEinvoiceReadiness(incomplete).missingFields).toContain('recipient country');
  });

  it('flags a VAT-registered issuer with no VAT number', () => {
    const incomplete: DocumentDto = {
      ...bgDomesticStandardInvoice,
      issuer: { ...bgDomesticStandardInvoice.issuer, vatNumber: null },
    };
    expect(checkEinvoiceReadiness(incomplete).missingFields).toContain('issuer VAT number');
  });
});

describe('checkEinvoiceReadiness — reverse charge and exemption grounds', () => {
  it('flags a missing recipient VAT number on a reverse-charge document', () => {
    const incomplete: DocumentDto = {
      ...bgToEuReverseChargeInvoice,
      recipient: { ...bgToEuReverseChargeInvoice.recipient, vatNumber: null },
    };
    expect(checkEinvoiceReadiness(incomplete).missingFields).toContain(
      'recipient VAT number (required for intra-EU reverse charge)',
    );
  });

  it('flags a missing exemption ground when a non-standard category has none', () => {
    const incomplete: DocumentDto = { ...bgToEuReverseChargeInvoice, vatExemptionGround: null };
    expect(checkEinvoiceReadiness(incomplete).missingFields).toContain(
      'VAT exemption ground (required for the selected VAT category)',
    );
  });

  it('does not require an exemption ground for the standard category', () => {
    expect(checkEinvoiceReadiness(bgDomesticStandardInvoice).missingFields).not.toContain(
      'VAT exemption ground (required for the selected VAT category)',
    );
  });
});

describe('checkEinvoiceReadiness — line items', () => {
  it('flags a missing unit code on a line item', () => {
    const [line] = bgDomesticStandardInvoice.lineItems;
    if (!line) throw new Error('expected fixture to carry a line item');
    const incomplete: DocumentDto = {
      ...bgDomesticStandardInvoice,
      lineItems: [{ ...line, unitCode: null }],
    };
    expect(checkEinvoiceReadiness(incomplete).missingFields).toContain(
      `unit code on line item "${line.name}"`,
    );
  });

  it('flags a document with no line items', () => {
    const incomplete: DocumentDto = { ...bgDomesticStandardInvoice, lineItems: [] };
    expect(checkEinvoiceReadiness(incomplete).missingFields).toContain('at least one line item');
  });
});

describe('checkEinvoiceReadiness — payment means', () => {
  it('flags a missing buyer reference for credit-transfer payment means', () => {
    const incomplete: DocumentDto = { ...bgDomesticStandardInvoice, buyerReference: null };
    expect(checkEinvoiceReadiness(incomplete).missingFields).toContain(
      'buyer reference (required for the selected payment means)',
    );
  });

  it('does not require a buyer reference when payment means is unset', () => {
    const noPaymentMeans: DocumentDto = {
      ...bgDomesticStandardInvoice,
      paymentMeansCode: null,
      buyerReference: null,
    };
    expect(checkEinvoiceReadiness(noPaymentMeans).missingFields).not.toContain(
      'buyer reference (required for the selected payment means)',
    );
  });
});
