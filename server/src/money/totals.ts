import { type Cents, roundHalfUp } from '@fakturcho/shared-types';

export interface TotalsLineInput {
  quantity: string;
  unitPrice: Cents;
}

export interface TotalsDiscountInput {
  percentBp?: number | null;
  amount?: Cents | null;
}

export interface TotalsInput {
  lineItems: readonly TotalsLineInput[];
  discounts: readonly TotalsDiscountInput[];
  vatCharged: boolean;
  vatRateBp: number;
  vatIncluded: boolean;
}

export interface DocumentTotals {
  subtotal: Cents;
  discountTotal: Cents;
  vatAmount: Cents;
  amount: Cents;
}

function roundCents(value: number): Cents {
  return roundHalfUp(value, 0);
}

export function computeLineTotal(quantity: string, unitPrice: Cents): Cents {
  const quantityMilli = roundCents(Number(quantity) * 1000);
  return roundCents((quantityMilli * unitPrice) / 1000);
}

export function computeDocumentTotals(input: TotalsInput): DocumentTotals {
  const rawSubtotal = input.lineItems.reduce(
    (sum, line) => sum + computeLineTotal(line.quantity, line.unitPrice),
    0,
  );
  const subtotal =
    input.vatCharged && input.vatIncluded
      ? roundCents((rawSubtotal * 10000) / (10000 + input.vatRateBp))
      : rawSubtotal;
  const discountTotal = input.discounts.reduce((sum, discount) => {
    if (discount.percentBp != null) {
      return sum + roundCents((subtotal * discount.percentBp) / 10000);
    }
    return sum + (discount.amount ?? 0);
  }, 0);
  const base = subtotal - discountTotal;
  const vatAmount = input.vatCharged ? roundCents((base * input.vatRateBp) / 10000) : 0;
  return { subtotal, discountTotal, vatAmount, amount: base + vatAmount };
}
