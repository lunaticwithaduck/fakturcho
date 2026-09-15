import type { LineItemDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { groupVatSubtotals } from '../../../einvoice/vat-grouping';
import { buildFakeDocument, buildFakeMixedLineItems } from './testing/fake-document';
import { discountAdjustedVatGroups } from './totals-block';

describe('PDF totals vs e-invoice VAT grouping', () => {
  it('the PDF totals-block groups match the e-invoice TaxSubtotal groups and the stored vatAmount', () => {
    const document = buildFakeDocument({ subtotal: 100000, discountTotal: 0, vatAmount: 10000 });
    const lineItems = buildFakeMixedLineItems();

    const pdfGroups = discountAdjustedVatGroups(document, lineItems);

    const xmlLineItems: LineItemDto[] = lineItems.map((line) => ({
      id: line.id,
      name: line.name,
      quantity: line.quantity.toString(),
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      sortOrder: line.sortOrder,
      vatRateBp: line.vatRateBp,
      vatCategory: line.vatCategory as LineItemDto['vatCategory'],
      unitCode: line.unitCode,
    }));
    const xmlGroups = groupVatSubtotals(xmlLineItems);

    expect(pdfGroups).toEqual(xmlGroups);
    expect(pdfGroups.reduce((sum, group) => sum + group.vatAmount, 0)).toBe(document.vatAmount);
  });
});
