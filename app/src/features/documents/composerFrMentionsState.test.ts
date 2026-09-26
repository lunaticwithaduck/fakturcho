import type { DocumentDto } from '@shared/types';
import { describe, expect, it } from 'vitest';
import {
  blankFrMentionsState,
  frMentionsRequestFields,
  frMentionsStateFromDocument,
  isFrenchTaxDocument,
} from './composerFrMentionsState';

function fakeDocument(overrides: Partial<DocumentDto>): DocumentDto {
  return {
    id: 'doc-1',
    documentType: 'invoice',
    status: 'draft',
    number: null,
    numberPrefix: null,
    numberSuffix: null,
    referenceNumber: null,
    originalDocumentId: null,
    ksefNumber: null,
    correctionReason: null,
    issuedAt: null,
    taxEventAt: null,
    dueAt: null,
    validUntil: null,
    deliveryDate: null,
    buyerReference: null,
    paymentMeansCode: null,
    paymentTermsNote: null,
    transportReason: null,
    transportedAt: null,
    carrierName: null,
    transportNote: null,
    subtotal: 0,
    discountTotal: 0,
    amount: 0,
    vatIncluded: false,
    vatRateBp: 0,
    vatAmount: 0,
    vatExemptionGround: null,
    currency: 'EUR',
    clientId: null,
    preparedBy: null,
    notes: null,
    emailText: null,
    emailedAt: null,
    templateId: 'classic',
    documentLanguage: null,
    issuer: {
      companyName: null,
      eik: null,
      mol: null,
      addressLine: null,
      street: null,
      postcode: null,
      countyRegion: null,
      city: null,
      country: null,
      phone: null,
      vatRegistered: false,
      vatNumber: null,
      bankName: null,
      iban: null,
      bic: null,
      altIban: null,
      identifiers: {},
    },
    recipient: {
      companyName: null,
      eik: null,
      vatNumber: null,
      address: null,
      street: null,
      postcode: null,
      countyRegion: null,
      city: null,
      country: null,
      email: null,
      mol: null,
      sdiRecipientCode: null,
      pec: null,
      clientType: null,
    },
    lineItems: [],
    discounts: [],
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('isFrenchTaxDocument', () => {
  it('is true only for a French issuer and a tax document type', () => {
    expect(isFrenchTaxDocument('FR', true)).toBe(true);
    expect(isFrenchTaxDocument('FR', false)).toBe(false);
    expect(isFrenchTaxDocument('BG', true)).toBe(false);
  });
});

describe('frMentionsStateFromDocument', () => {
  it('reads the nature of operation and delivery address off the document', () => {
    const document = fakeDocument({ operationNature: 'mixed', deliveryAddress: '1 rue Test' });
    expect(frMentionsStateFromDocument(document)).toEqual({
      operationNature: 'mixed',
      deliveryAddress: '1 rue Test',
    });
  });

  it('defaults to blank when the document carries neither', () => {
    expect(frMentionsStateFromDocument(fakeDocument({}))).toEqual(blankFrMentionsState());
  });
});

describe('frMentionsRequestFields', () => {
  it('sends null for both fields when not applicable', () => {
    const state = { operationNature: 'goods' as const, deliveryAddress: '1 rue Test' };
    expect(frMentionsRequestFields(state, false)).toEqual({
      operationNature: null,
      deliveryAddress: null,
    });
  });

  it('trims the delivery address and drops it when blank', () => {
    const state = { operationNature: 'goods' as const, deliveryAddress: '  ' };
    expect(frMentionsRequestFields(state, true)).toEqual({
      operationNature: 'goods',
      deliveryAddress: null,
    });
  });
});
