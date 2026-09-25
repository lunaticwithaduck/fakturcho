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
      operationNature: 'services',
      deliveryAddress: '12 rue de la Gare, 69001 Lyon',
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

  it('rejects an invalid operationNature', () => {
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'invoice',
        operationNature: 'other',
        lineItems: [],
      }),
    ).toThrow();
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

  it('rejects a unitCode outside the UN/ECE Rec 20 list', () => {
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'invoice',
        lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0, unitCode: 'szt.' }],
      }),
    ).toThrow();
  });

  it('accepts a null unitCode', () => {
    const parsed = saveDraftRequestSchema.parse({
      documentType: 'invoice',
      lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0, unitCode: null }],
    });
    expect(parsed.lineItems[0]?.unitCode).toBeNull();
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

  it('accepts a well-formed transportedAt wall-clock reading', () => {
    const parsed = saveDraftRequestSchema.parse({
      documentType: 'delivery_note',
      transportedAt: '2026-09-15T09:30',
      lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
    });
    expect(parsed.transportedAt).toBe('2026-09-15T09:30');
  });

  it('accepts a null transportedAt', () => {
    const parsed = saveDraftRequestSchema.parse({
      documentType: 'invoice',
      transportedAt: null,
      lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
    });
    expect(parsed.transportedAt).toBeNull();
  });

  it.each([
    ['2026-09-15T09:30:00.000Z', 'carries seconds/ms and a Z suffix'],
    ['2026-09-15 09:30', 'uses a space instead of T'],
    ['2026-02-30T09:30', 'is not a real calendar date'],
    ['2026-04-31T09:30', 'April has only 30 days'],
    ['2026-09-15T24:00', 'hour is out of range'],
    ['2026-09-15T09:60', 'minute is out of range'],
    ['not-a-date', 'is garbage'],
  ])('rejects a transportedAt that %s (%s)', (value) => {
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'delivery_note',
        transportedAt: value,
        lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
      }),
    ).toThrow();
  });

  it('accepts 2028-02-29 for the leap year but rejects it for 2029', () => {
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'delivery_note',
        transportedAt: '2028-02-29T09:30',
        lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
      }),
    ).not.toThrow();
    expect(() =>
      saveDraftRequestSchema.parse({
        documentType: 'delivery_note',
        transportedAt: '2029-02-29T09:30',
        lineItems: [{ name: 'X', quantity: '1', unitPrice: 100, sortOrder: 0 }],
      }),
    ).toThrow();
  });
});
