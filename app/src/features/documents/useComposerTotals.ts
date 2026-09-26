import type { ComposerFormState } from './composerState';
import { computeLiveTotals, type LiveTotals, type VatTreatment } from './liveTotals';

export interface ComposerTotals {
  totals: LiveTotals;
  // null when charged lines carry more than one effective rate.
  vatRatePercent: number | null;
}

export function useComposerTotals(
  state: ComposerFormState,
  vat: VatTreatment,
  defaultVatRateBp: number,
): ComposerTotals {
  const totals = computeLiveTotals({
    lineItems: state.lineItems.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? 0,
      vatRateBp: line.vatRateBp,
    })),
    discounts: state.discounts.map((discount) => ({
      percentBp: discount.mode === 'percent' ? discount.percentBp : null,
      amount: discount.mode === 'amount' ? discount.amount : null,
    })),
    vatCharged: vat.vatCharged,
    vatRateBp: vat.vatRateBp,
  });
  const lineVatRates = new Set(state.lineItems.map((line) => line.vatRateBp ?? defaultVatRateBp));
  const [singleLineVatRate] = lineVatRates;
  const vatRatePercent =
    vat.vatCharged && lineVatRates.size === 1
      ? (singleLineVatRate ?? defaultVatRateBp) / 100
      : null;
  return { totals, vatRatePercent };
}
