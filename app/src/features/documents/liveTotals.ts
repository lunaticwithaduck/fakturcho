import { roundHalfUp, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
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
  // A line's own rate, when it differs from the document's vatRateBp (a
  // reduced-rate override). Unset lines fall back to input.vatRateBp.
  vatRateBp?: number | null;
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

interface RawLine {
  lineTotal: Cents;
  rateBp: number;
}

function distributeDiscount(lines: readonly RawLine[], discountTotal: Cents, subtotal: Cents) {
  let allocated = 0;
  let cumulativeExact = 0;
  return lines.map((line, index) => {
    cumulativeExact += (line.lineTotal * discountTotal) / subtotal;
    const cumulativeRounded =
      index === lines.length - 1 ? discountTotal : roundHalfUp(cumulativeExact, 0);
    const lineDiscount = cumulativeRounded - allocated;
    allocated = cumulativeRounded;
    return { ...line, lineTotal: line.lineTotal - lineDiscount };
  });
}

export function computeLiveTotals(input: LiveTotalsInput): LiveTotals {
  const rawLines: RawLine[] = input.lineItems.map((line) => ({
    lineTotal: computeLineTotal(line.quantity, line.unitPrice),
    rateBp: input.vatCharged ? (line.vatRateBp ?? input.vatRateBp) : 0,
  }));
  const subtotal = rawLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discountTotal = input.discounts.reduce((sum, discount) => {
    if (discount.percentBp != null) {
      return sum + roundHalfUp((subtotal * discount.percentBp) / 10000, 0);
    }
    return sum + (discount.amount ?? 0);
  }, 0);
  const discountedLines =
    discountTotal === 0 || subtotal === 0
      ? rawLines
      : distributeDiscount(rawLines, discountTotal, subtotal);
  const taxableByRate = new Map<number, Cents>();
  for (const line of discountedLines) {
    taxableByRate.set(line.rateBp, (taxableByRate.get(line.rateBp) ?? 0) + line.lineTotal);
  }
  const vatAmount = Array.from(taxableByRate.entries()).reduce(
    (sum, [rateBp, taxableAmount]) =>
      sum + (rateBp > 0 ? roundHalfUp((taxableAmount * rateBp) / 10000, 0) : 0),
    0,
  );
  const base = subtotal - discountTotal;
  return { subtotal, discountTotal, vatAmount, amount: base + vatAmount };
}

export interface VatTreatmentInput {
  documentType: DocumentType;
  vatRegistered: boolean;
  chargeVat: boolean;
  vatRateBp: number;
  groundRequired: boolean;
}

export interface VatTreatment {
  isTaxDocument: boolean;
  vatCharged: boolean;
  vatRateBp: number;
  groundSelectable: boolean;
}

export function resolveVatTreatment(input: VatTreatmentInput): VatTreatment {
  const isTaxDocument = TAX_DOCUMENT_TYPES[input.documentType];
  if (!isTaxDocument) {
    return { isTaxDocument, vatCharged: false, vatRateBp: 0, groundSelectable: false };
  }
  if (!input.vatRegistered) {
    return {
      isTaxDocument,
      vatCharged: false,
      vatRateBp: 0,
      groundSelectable: input.groundRequired,
    };
  }
  if (input.chargeVat) {
    return {
      isTaxDocument,
      vatCharged: true,
      vatRateBp: input.vatRateBp,
      groundSelectable: false,
    };
  }
  return { isTaxDocument, vatCharged: false, vatRateBp: 0, groundSelectable: true };
}
