import { describe, expect, it } from 'vitest';
import { saveDraftRequestSchema } from './dto-schemas';

describe('saveDraftRequestSchema', () => {
  it('accepts and keeps every EU/UBL document and line-item field instead of stripping it', () => {
    const body = {
      documentType: 'invoice',
      buyerReference: 'PO-1234',
      paymentMeansCode: '30',
      paymentTermsNote: 'Net 30',
      deliveryDate: '2026-09-15',
      lineItems: [
        {
          name: 'Consulting',
          quantity: '1',
          unitPrice: 1000,
          sortOrder: 0,
          vatRateBp: 900,
          vatCategory: 'Z',
          unitCode: 'HUR',
        },
      ],
    };

    const parsed = saveDraftRequestSchema.parse(body);
    expect(parsed).toMatchObject(body);
  });

  it('rejects an invalid vatCategory', () => {
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'invoice',
        lineItems: [
          { name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0, vatCategory: 'NOPE' },
        ],
      }),
    ).toThrow();
  });
});

describe('saveDraftRequestSchema — format validation', () => {
  it('accepts an explicit documentLanguage override', () => {
    const parsed = saveDraftRequestSchema.parse({
      documentType: 'invoice',
      documentLanguage: 'en',
      lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
    });
    expect(parsed.documentLanguage).toBe('en');
  });

  it('rejects a documentLanguage outside the document languages', () => {
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'invoice',
        documentLanguage: 'xx',
        lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
      }),
    ).toThrow();
  });

  it('rejects a deliveryDate that is not YYYY-MM-DD', () => {
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'invoice',
        deliveryDate: '15/09/2026',
        lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
      }),
    ).toThrow();
  });

  it('rejects a non-numeric paymentMeansCode', () => {
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'invoice',
        paymentMeansCode: 'wire',
        lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
      }),
    ).toThrow();
  });
});
