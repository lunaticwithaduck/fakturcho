import type { LineItemInput, SaveDraftRequest } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { buildDraftData, type ResolvedDraftLineItem } from './draft-data.builder';
import { resolveVatTreatment } from './vat-treatment';

function request(
  lineItems: LineItemInput[],
  overrides: Partial<SaveDraftRequest> = {},
): SaveDraftRequest {
  return { documentType: 'invoice', lineItems, ...overrides };
}

const registered = resolveVatTreatment({
  documentType: 'invoice',
  vatRegistered: true,
  requestedGround: null,
});

describe('buildDraftData — grouped totals', () => {
  it('a discount that does not split evenly still sums exactly across mixed-rate lines', () => {
    const lineItems: LineItemInput[] = [
      { name: 'A', quantity: '1', unitPrice: 333, sortOrder: 0, vatCategory: 'S', vatRateBp: 2000 },
      { name: 'B', quantity: '1', unitPrice: 333, sortOrder: 1, vatCategory: 'S', vatRateBp: 2000 },
      { name: 'C', quantity: '1', unitPrice: 334, sortOrder: 2, vatCategory: 'S', vatRateBp: 2000 },
    ];
    const resolved: ResolvedDraftLineItem[] = lineItems.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vatCategory: line.vatCategory ?? 'S',
      vatRateBp: line.vatRateBp ?? 2000,
    }));

    const data = buildDraftData(
      'acc1',
      request(lineItems, { discounts: [{ label: 'promo', percentBp: 100 }] }),
      registered,
      resolved,
    );

    expect(data.subtotal).toBe(1000);
    expect(data.discountTotal).toBe(10);
    expect(data.amount).toBe(
      (data.subtotal ?? 0) - (data.discountTotal ?? 0) + (data.vatAmount ?? 0),
    );
  });

  it('groups sum to the same taxable base as the discount total, across three unequal rates', () => {
    const lineItems: LineItemInput[] = [
      { name: 'A', quantity: '1', unitPrice: 733, sortOrder: 0, vatCategory: 'S', vatRateBp: 2000 },
      { name: 'B', quantity: '1', unitPrice: 733, sortOrder: 1, vatCategory: 'AE', vatRateBp: 0 },
      { name: 'C', quantity: '1', unitPrice: 734, sortOrder: 2, vatCategory: 'Z', vatRateBp: 0 },
    ];
    const resolved: ResolvedDraftLineItem[] = lineItems.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vatCategory: line.vatCategory ?? 'S',
      vatRateBp: line.vatRateBp ?? 2000,
    }));

    const data = buildDraftData(
      'acc1',
      request(lineItems, { discounts: [{ label: 'promo', percentBp: 733 }] }),
      registered,
      resolved,
    );

    expect(data.amount).toBe(
      (data.subtotal ?? 0) - (data.discountTotal ?? 0) + (data.vatAmount ?? 0),
    );
  });
});
