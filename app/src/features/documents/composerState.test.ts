import { describe, expect, it } from 'vitest';
import {
  blankComposerState,
  type ComposerFormState,
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
    state.vatExemptionGround = 'чл.21 от ЗДДС';

    expect(toSaveDraftRequest(state, VAT_20).vatExemptionGround).toBeNull();
    expect(toSaveDraftRequest(state, NO_VAT).vatExemptionGround).toBeNull();
    expect(toSaveDraftRequest(state, VAT_GROUND).vatExemptionGround).toBe('чл.21 от ЗДДС');
  });
});

describe('validateComposerState', () => {
  it('requires an original document for credit and debit notes', () => {
    const state = withOneCompleteLine({ ...blankComposerState(), documentType: 'debit_note' });
    expect(validateComposerState(state, VAT_20)).toMatch(/оригинал/i);
  });

  it('requires at least one complete line item', () => {
    expect(validateComposerState(blankComposerState(), VAT_20)).toMatch(/артикул/i);
  });

  it('requires a VAT ground when one is selectable but unset', () => {
    const state = withOneCompleteLine(blankComposerState());
    expect(validateComposerState(state, VAT_GROUND)).toMatch(/основание/i);
  });

  it('passes for a complete invoice with standard VAT', () => {
    const state = withOneCompleteLine(blankComposerState());
    expect(validateComposerState(state, VAT_20)).toBeNull();
  });
});
