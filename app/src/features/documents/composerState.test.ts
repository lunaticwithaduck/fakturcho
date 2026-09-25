import type { DocumentDto } from '@shared/types';
import { describe, expect, it } from 'vitest';
import {
  blankComposerState,
  type ComposerFormState,
  composerStateFromDocument,
  createDiscount,
  createLineItem,
  toSaveDraftRequest,
  validateComposerState,
} from './composerState';
import type { VatTreatment } from './liveTotals';

const NO_VAT: VatTreatment = {
  isTaxDocument: true,
  vatCharged: false,
  vatRateBp: 0,
  groundSelectable: false,
};

const VAT_20: VatTreatment = {
  isTaxDocument: true,
  vatCharged: true,
  vatRateBp: 2000,
  groundSelectable: false,
};

const VAT_GROUND: VatTreatment = {
  isTaxDocument: true,
  vatCharged: false,
  vatRateBp: 0,
  groundSelectable: true,
};

function fakeDocument(overrides: Partial<DocumentDto>): DocumentDto {
  return {
    id: 'doc-1',
    documentType: 'delivery_note',
    status: 'draft',
    number: null,
    numberPrefix: null,
    numberSuffix: null,
    referenceNumber: null,
    originalDocumentId: null,
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
    vatIncluded: true,
    vatRateBp: 0,
    vatAmount: 0,
    vatExemptionGround: null,
    currency: 'EUR',
    clientId: null,
    preparedBy: null,
    notes: null,
    emailText: null,
    emailedAt: null,
    templateId: 'default',
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
    },
    lineItems: [],
    discounts: [],
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    ...overrides,
  };
}

function withOneCompleteLine(state: ComposerFormState): ComposerFormState {
  return {
    ...state,
    lineItems: [{ ...createLineItem(), name: 'Услуга', quantity: '2', unitPrice: 1000 }],
  };
}

describe('toSaveDraftRequest', () => {
  it('drops incomplete line items and discounts, and assigns sortOrder', () => {
    const state = withOneCompleteLine(blankComposerState());
    state.lineItems.push({ ...createLineItem(), name: '', quantity: '1', unitPrice: 500 });
    state.discounts = [
      { ...createDiscount(), label: '10%', mode: 'percent', percentBp: 1000 },
      { ...createDiscount(), label: '', mode: 'amount', amount: 100 },
    ];

    const request = toSaveDraftRequest(state, VAT_20);

    expect(request.lineItems).toEqual([
      { name: 'Услуга', quantity: '2', unitPrice: 1000, sortOrder: 0 },
    ]);
    expect(request.discounts).toEqual([
      { label: '10%', percentBp: 1000, amount: null, sortOrder: 0 },
    ]);
  });

  it('omits originalDocumentId for a non-correction document type', () => {
    const state = withOneCompleteLine(blankComposerState());
    state.originalDocumentId = 'doc-1';
    const request = toSaveDraftRequest(state, VAT_20);
    expect(request.originalDocumentId).toBeNull();
  });

  it('keeps originalDocumentId for credit and debit notes', () => {
    const state = withOneCompleteLine({ ...blankComposerState(), documentType: 'credit_note' });
    state.originalDocumentId = 'doc-1';
    const request = toSaveDraftRequest(state, VAT_20);
    expect(request.originalDocumentId).toBe('doc-1');
  });

  it('sends the exemption ground only when it is selectable', () => {
    const state = withOneCompleteLine(blankComposerState());
    state.vatExemptionGround = 'Обратно начисляване – чл. 21, ал. 2 от ЗДДС';

    expect(toSaveDraftRequest(state, VAT_20).vatExemptionGround).toBeNull();
    expect(toSaveDraftRequest(state, NO_VAT).vatExemptionGround).toBeNull();
    expect(toSaveDraftRequest(state, VAT_GROUND).vatExemptionGround).toBe(
      'Обратно начисляване – чл. 21, ал. 2 от ЗДДС',
    );
  });
});

describe('composerStateFromDocument', () => {
  it('localizes transportedAt into the issuer country timezone for editing', () => {
    const document = fakeDocument({ transportedAt: '2026-09-15T07:30:00.000Z' });
    const state = composerStateFromDocument(document, 'Europe/Rome');
    expect(state.transportedAt).toBe('2026-09-15T09:30');
  });
});

describe('validateComposerState', () => {
  it('requires an original document for credit and debit notes', () => {
    const state = withOneCompleteLine({ ...blankComposerState(), documentType: 'debit_note' });
    expect(validateComposerState(state, VAT_20)).toBe('missingOriginalDocument');
  });

  it('requires at least one complete line item', () => {
    expect(validateComposerState(blankComposerState(), VAT_20)).toBe('missingLineItems');
  });

  it('requires a VAT ground when one is selectable but unset', () => {
    const state = withOneCompleteLine(blankComposerState());
    expect(validateComposerState(state, VAT_GROUND)).toBe('missingVatGround');
  });

  it('passes for a complete invoice with standard VAT', () => {
    const state = withOneCompleteLine(blankComposerState());
    expect(validateComposerState(state, VAT_20)).toBeNull();
  });
});
