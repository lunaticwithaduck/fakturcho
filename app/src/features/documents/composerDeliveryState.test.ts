import type { DocumentDto } from '@shared/types';
import { describe, expect, it } from 'vitest';
import {
  blankDeliveryState,
  deliveryRequestFields,
  deliveryStateFromDocument,
} from './composerDeliveryState';

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
    },
    lineItems: [],
    discounts: [],
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('deliveryStateFromDocument', () => {
  it('renders the stored UTC instant back in the issuer country timezone', () => {
    const document = fakeDocument({ transportedAt: '2026-09-15T07:30:00.000Z' });
    expect(deliveryStateFromDocument(document, 'Europe/Rome').transportedAt).toBe(
      '2026-09-15T09:30',
    );
    expect(deliveryStateFromDocument(document, 'Europe/Sofia').transportedAt).toBe(
      '2026-09-15T10:30',
    );
  });

  it('leaves transportedAt blank when the document carries none', () => {
    const document = fakeDocument({ transportedAt: null });
    expect(deliveryStateFromDocument(document, 'Europe/Rome').transportedAt).toBe('');
  });
});

describe('deliveryRequestFields round trip', () => {
  it('sends the wall-clock value typed into the datetime-local input unchanged', () => {
    const document = fakeDocument({ transportedAt: '2026-09-15T07:30:00.000Z' });
    const state = deliveryStateFromDocument(document, 'Europe/Rome');
    const fields = deliveryRequestFields(state, true);
    expect(fields.transportedAt).toBe('2026-09-15T09:30');
  });

  it('sends null fields for a non-delivery-note document type', () => {
    const fields = deliveryRequestFields(
      { ...blankDeliveryState(), transportedAt: '2026-09-15T09:30' },
      false,
    );
    expect(fields.transportedAt).toBeNull();
  });
});
