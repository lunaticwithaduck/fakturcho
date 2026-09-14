import type { DocumentDto, LineItemDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { beniServiziBlock } from './fatturapa-lines';

function line(overrides: Partial<LineItemDto>): LineItemDto {
  return {
    id: 'line-1',
    name: 'Item',
    quantity: '1',
    unitPrice: 0,
    lineTotal: 0,
    sortOrder: 0,
    vatRateBp: 0,
    vatCategory: 'S',
    unitCode: null,
    ...overrides,
  };
}

function document(lineItems: LineItemDto[]): DocumentDto {
  return {
    id: 'doc-1',
    documentType: 'invoice',
    status: 'sent',
    number: 1,
    numberPrefix: null,
    numberSuffix: null,
    referenceNumber: null,
    originalDocumentId: null,
    issuedAt: '2026-09-09',
    taxEventAt: '2026-09-09',
    dueAt: null,
    validUntil: null,
    deliveryDate: null,
    buyerReference: null,
    paymentMeansCode: null,
    paymentTermsNote: null,
    subtotal: lineItems.reduce((sum, l) => sum + l.lineTotal, 0),
    discountTotal: 0,
    amount: lineItems.reduce((sum, l) => sum + l.lineTotal, 0),
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
    documentLanguage: 'en',
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
      vatRegistered: null,
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
    lineItems,
    discounts: [],
    createdAt: '2026-09-09T00:00:00.000Z',
    updatedAt: '2026-09-09T00:00:00.000Z',
  };
}

describe('beniServiziBlock', () => {
  it('rounds the VAT once on the aggregated taxable amount, not per line', () => {
    const xml = beniServiziBlock(
      document([
        line({ id: 'line-1', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
        line({ id: 'line-2', lineTotal: 1, vatRateBp: 2500, vatCategory: 'S' }),
      ]),
    );
    expect(xml).toContain('<ImponibileImporto>0.02</ImponibileImporto>');
    expect(xml).toContain('<Imposta>0.01</Imposta>');
  });

  it('emits one DatiRiepilogo per distinct category/rate pair, not per line', () => {
    const xml = beniServiziBlock(
      document([
        line({ id: 'line-1', lineTotal: 10000, vatRateBp: 2200, vatCategory: 'S' }),
        line({ id: 'line-2', lineTotal: 20000, vatRateBp: 2200, vatCategory: 'S' }),
        line({ id: 'line-3', lineTotal: 5000, vatRateBp: 0, vatCategory: 'Z' }),
      ]),
    );
    expect((xml.match(/<DatiRiepilogo>/g) ?? []).length).toBe(2);
    expect(xml).toContain('<ImponibileImporto>300.00</ImponibileImporto>');
    expect(xml).toContain('<Imposta>66.00</Imposta>');
  });
});
