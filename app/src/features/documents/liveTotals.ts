import { DEFAULT_VAT_RATE_BP, roundHalfUp, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type { Cents, DocumentType } from '@shared/types';

export function normalizeQuantity(raw: string): string | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  if (Number(trimmed) <= 0) return null;
  return trimmed;
}

export function computeLineTotal(quantity: string, unitPrice: Cents): Cents {
  const normalized = normalizeQuantity(quantity);
  if (normalized === null) return 0;
  const quantityMilli = roundHalfUp(Number(normalized) * 1000, 0);
  return roundHalfUp((quantityMilli * unitPrice) / 1000, 0);
}

export function parsePercentInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

export function percentBpToEditableValue(bp: number | null): string {
  if (bp === null) return '';
  return String(bp / 100).replace('.', ',');
}

export interface LiveLineInput {
  quantity: string;
  unitPrice: Cents;
}

export interface LiveDiscountInput {
  percentBp: number | null;
  amount: Cents | null;
}

export interface LiveTotalsInput {
  lineItems: readonly LiveLineInput[];
  discounts: readonly LiveDiscountInput[];
  vatCharged: boolean;
  vatRateBp: number;
}

export interface LiveTotals {
  subtotal: Cents;
  discountTotal: Cents;
  vatAmount: Cents;
  amount: Cents;
}

export function computeLiveTotals(input: LiveTotalsInput): LiveTotals {
  const subtotal = input.lineItems.reduce(
    (sum, line) => sum + computeLineTotal(line.quantity, line.unitPrice),
    0,
  );
  const discountTotal = input.discounts.reduce((sum, discount) => {
    if (discount.percentBp != null) {
      return sum + roundHalfUp((subtotal * discount.percentBp) / 10000, 0);
    }
    return sum + (discount.amount ?? 0);
  }, 0);
  const base = subtotal - discountTotal;
  const vatAmount = input.vatCharged ? roundHalfUp((base * input.vatRateBp) / 10000, 0) : 0;
  return { subtotal, discountTotal, vatAmount, amount: base + vatAmount };
}

export interface VatTreatmentInput {
  documentType: DocumentType;
  vatRegistered: boolean;
  chargeVat: boolean;
}

export interface VatTreatment {
  isTaxDocument: boolean;
  vatCharged: boolean;
  vatRateBp: number;
  groundSelectable: boolean;
}

export function resolveVatTreatment(input: VatTreatmentInput): VatTreatment {
  const isTaxDocument = TAX_DOCUMENT_TYPES[input.documentType];
  if (!isTaxDocument || !input.vatRegistered) {
    return { isTaxDocument, vatCharged: false, vatRateBp: 0, groundSelectable: false };
  }
  if (input.chargeVat) {
    return {
      isTaxDocument,
      vatCharged: true,
      vatRateBp: DEFAULT_VAT_RATE_BP,
      groundSelectable: false,
    };
  }
  return { isTaxDocument, vatCharged: false, vatRateBp: 0, groundSelectable: true };
}
