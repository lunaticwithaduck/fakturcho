import type { LineItemDto, LineItemInput } from '@shared/types';
import { normalizeQuantity } from './liveTotals';

export interface LineItemFormState {
  key: string;
  name: string;
  quantity: string;
  unitPrice: number | null;
  // null: use the document's VAT rate. Set only when the user picks a
  // different rate from countryConfig.vatRates for this specific line.
  vatRateBp: number | null;
  unitCode: string | null;
  // PL only: art. 106e ust. 1 pkt 18a / załącznik nr 15 ustawy o VAT.
  splitPaymentAnnex15: boolean;
}

function makeKey(): string {
  return crypto.randomUUID();
}

export function createLineItem(): LineItemFormState {
  return {
    key: makeKey(),
    name: '',
    quantity: '1',
    unitPrice: null,
    vatRateBp: null,
    unitCode: null,
    splitPaymentAnnex15: false,
  };
}

export function lineItemFormStateFromDto(
  line: LineItemDto,
  defaultVatRateBp: number,
): LineItemFormState {
  return {
    key: line.id,
    name: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    vatRateBp: line.vatRateBp === defaultVatRateBp ? null : line.vatRateBp,
    unitCode: line.unitCode,
    splitPaymentAnnex15: line.splitPaymentAnnex15 ?? false,
  };
}

export function isCompleteLineItem(line: LineItemFormState): boolean {
  return (
    line.name.trim() !== '' && normalizeQuantity(line.quantity) !== null && line.unitPrice !== null
  );
}

export function buildLineItemInputs(lines: readonly LineItemFormState[]): LineItemInput[] {
  return lines.filter(isCompleteLineItem).map((line, index) => ({
    name: line.name.trim(),
    quantity: normalizeQuantity(line.quantity) ?? '0',
    unitPrice: line.unitPrice ?? 0,
    sortOrder: index,
    ...(line.vatRateBp !== null ? { vatRateBp: line.vatRateBp } : {}),
    unitCode: line.unitCode,
    ...(line.splitPaymentAnnex15 ? { splitPaymentAnnex15: true } : {}),
  }));
}
