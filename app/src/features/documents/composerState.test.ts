import type { DocumentDto } from '@shared/types';
import { describe, expect, it } from 'vitest';
import {
  blankComposerState,
  type ComposerFormState,
  composerStateFromDocument,
  createDiscount,
  createLineItem,
  toSaveDraftRequest,
} from './composerState';
import { validateComposerState } from './composerValidation';
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
    correctionReason: null,
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
      clientType: null,
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
      { name: 'Услуга', quantity: '2', unitPrice: 1000, sortOrder: 0, unitCode: null },
    ]);
    expect(request.discounts).toEqual([
      { label: '10%', percentBp: 1000, amount: null, sortOrder: 0 },
    ]);
  });

  it('sends an explicit vatRateBp and unitCode only for lines that carry one', () => {
    const state = blankComposerState();
    state.lineItems = [
      { ...createLineItem(), name: 'Standard', quantity: '1', unitPrice: 1000 },
      {
        ...createLineItem(),
        name: 'Reduced',
        quantity: '1',
        unitPrice: 1000,
        vatRateBp: 900,
        unitCode: 'HUR',
      },
    ];

    const request = toSaveDraftRequest(state, VAT_20);

    expect(request.lineItems).toEqual([
      { name: 'Standard', quantity: '1', unitPrice: 1000, sortOrder: 0, unitCode: null },
      {
        name: 'Reduced',
        quantity: '1',
        unitPrice: 1000,
        sortOrder: 1,
        vatRateBp: 900,
        unitCode: 'HUR',
      },
    ]);
  });

  it('sends splitPaymentAnnex15 only for a line that carries it, omitting the default false', () => {
    const state = blankComposerState();
    state.lineItems = [
      { ...createLineItem(), name: 'Plain', quantity: '1', unitPrice: 1000 },
      {
        ...createLineItem(),
        name: 'Annex 15',
        quantity: '1',
        unitPrice: 1000,
        splitPaymentAnnex15: true,
      },
    ];

    const request = toSaveDraftRequest(state, VAT_20);

    expect(request.lineItems).toEqual([
      { name: 'Plain', quantity: '1', unitPrice: 1000, sortOrder: 0, unitCode: null },
      {
        name: 'Annex 15',
        quantity: '1',
        unitPrice: 1000,
        sortOrder: 1,
        unitCode: null,
        splitPaymentAnnex15: true,
      },
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

  it('drops correctionReason for a non-correction document type', () => {
    const state = withOneCompleteLine(blankComposerState());
    state.correctionReason = 'Върната стока';
    const request = toSaveDraftRequest(state, VAT_20);
    expect(request.correctionReason).toBeNull();
  });

  it('trims and keeps correctionReason for credit and debit notes', () => {
    const state = withOneCompleteLine({ ...blankComposerState(), documentType: 'debit_note' });
    state.correctionReason = '  Върната стока  ';
    const request = toSaveDraftRequest(state, VAT_20);
    expect(request.correctionReason).toBe('Върната стока');
  });

  it('sends null correctionReason for a correction document type when left blank', () => {
    const state = withOneCompleteLine({ ...blankComposerState(), documentType: 'credit_note' });
    const request = toSaveDraftRequest(state, VAT_20);
    expect(request.correctionReason).toBeNull();
  });

  it('sends the nature of operation and delivery address only for a French tax document', () => {
    const state = {
      ...withOneCompleteLine(blankComposerState()),
      operationNature: 'services' as const,
      deliveryAddress: '12 rue de la Gare, Lyon',
    };

    expect(toSaveDraftRequest(state, VAT_20, 'FR').operationNature).toBe('services');
    expect(toSaveDraftRequest(state, VAT_20, 'FR').deliveryAddress).toBe('12 rue de la Gare, Lyon');
    expect(toSaveDraftRequest(state, VAT_20, 'BG').operationNature).toBeNull();
    expect(toSaveDraftRequest(state, VAT_20, 'BG').deliveryAddress).toBeNull();
    expect(
      toSaveDraftRequest(state, { ...VAT_20, isTaxDocument: false }, 'FR').operationNature,
    ).toBeNull();
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

  it('carries an existing correctionReason into the form, defaulting to an empty string', () => {
    const withReason = fakeDocument({ correctionReason: 'Върната стока' });
    expect(composerStateFromDocument(withReason, 'Europe/Sofia', 2000).correctionReason).toBe(
      'Върната стока',
    );

    const withoutReason = fakeDocument({ correctionReason: null });
    expect(composerStateFromDocument(withoutReason, 'Europe/Sofia', 2000).correctionReason).toBe(
      '',
    );
  });
});

describe('composerStateFromDocument', () => {
  it('localizes transportedAt into the issuer country timezone for editing', () => {
    const document = fakeDocument({ transportedAt: '2026-09-15T07:30:00.000Z' });
    const state = composerStateFromDocument(document, 'Europe/Rome', 2000);
    expect(state.transportedAt).toBe('2026-09-15T09:30');
  });

  it('treats a line at the document default rate as unset, and a reduced rate as an explicit override', () => {
    const document = fakeDocument({
      vatRateBp: 2000,
      lineItems: [
        {
          id: 'li-1',
          name: 'A',
          quantity: '1',
          unitPrice: 1000,
          lineTotal: 1000,
          sortOrder: 0,
          vatRateBp: 2000,
          vatCategory: 'S',
          unitCode: null,
        },
        {
          id: 'li-2',
          name: 'B',
          quantity: '1',
          unitPrice: 1000,
          lineTotal: 1000,
          sortOrder: 1,
          vatRateBp: 900,
          vatCategory: 'S',
          unitCode: 'HUR',
        },
      ],
    });
    const state = composerStateFromDocument(document, 'Europe/Sofia', 2000);
    expect(state.lineItems[0]).toMatchObject({ vatRateBp: null, unitCode: null });
    expect(state.lineItems[1]).toMatchObject({ vatRateBp: 900, unitCode: 'HUR' });
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

  it('requires the nature of operation for a French tax document', () => {
    const state = withOneCompleteLine(blankComposerState());
    expect(validateComposerState(state, VAT_20, 'FR')).toBe('missingOperationNature');
    expect(validateComposerState(state, VAT_20, 'BG')).toBeNull();
  });

  it('passes once the nature of operation is set for a French tax document', () => {
    const state = {
      ...withOneCompleteLine(blankComposerState()),
      operationNature: 'goods' as const,
    };
    expect(validateComposerState(state, VAT_20, 'FR')).toBeNull();
  });

  it('does not require the nature of operation for a French quote', () => {
    const state = withOneCompleteLine({ ...blankComposerState(), documentType: 'quote' });
    expect(validateComposerState(state, { ...VAT_20, isTaxDocument: false }, 'FR')).toBeNull();
  });
});
