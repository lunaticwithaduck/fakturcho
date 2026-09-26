import { roundHalfUp } from '@fakturcho/shared-types';

// art. 108a ust. 1a / art. 106e ust. 1 pkt 18a ustawy o VAT: the mention and
// P_18A=1 are mandatory once the invoice's gross total STRICTLY EXCEEDS
// 15 000 zł ("przekracza", not "wynosi co najmniej"), grosze.
export const MPP_ANNEX_15_THRESHOLD_PLN_CENTS = 1_500_000;

export interface MppRequiredInput {
  // Whether any line documents a good/service listed in załącznik nr 15.
  hasAnnex15Line: boolean;
  currency: string;
  // Gross total in `currency`'s cents — for a credit_note/debit_note this is
  // already the corrected (post-correction) total, not the correction's own
  // delta (art. 108a ust. 1a compares "kwota należności ogółem", the
  // corrected invoice's whole amount, per KIS 26.02.2021 guidance).
  grossAmountCents: number;
  // The same NBP snapshot rate already resolved for the document's local-
  // currency VAT line (document-issuance-local-currency.ts) — art. 106e
  // ust. 1 pkt 18a requires the art. 31a conversion rules, i.e. this rate.
  exchangeRate: string | null;
  // art. 106e ust. 1 pkt 18a / XSD note "na rzecz podatnika": MPP only ever
  // applies to a supply made to a taxpayer, never to a consumer.
  recipientIsTaxpayer: boolean;
}

export interface RecipientTaxpayerInput {
  clientType: string | null;
  vatNumber: string | null;
}

// clientType is the real signal (mirrors the AT UID rule in
// document-issuance.rules.ts); when it is unmeasured (null, an existing
// client from before the field existed), fall back to "has a NIP/VAT number
// on file" as the business signal.
export function isRecipientTaxpayer(input: RecipientTaxpayerInput): boolean {
  if (input.clientType === 'consumer') return false;
  if (input.clientType === 'business') return true;
  return Boolean(input.vatNumber);
}

export function isMppRequired(input: MppRequiredInput): boolean {
  if (!input.hasAnnex15Line || !input.recipientIsTaxpayer) return false;
  const grossPlnCents =
    input.currency === 'PLN'
      ? input.grossAmountCents
      : input.exchangeRate !== null
        ? roundHalfUp(input.grossAmountCents * Number(input.exchangeRate), 0)
        : null;
  if (grossPlnCents === null) return false;
  return grossPlnCents > MPP_ANNEX_15_THRESHOLD_PLN_CENTS;
}

// A credit_note carries its difference with a minus sign (art. 106j ust. 2
// pkt 5), a debit_note (correction in plus) stays positive — the same sign
// fa3-mapper.ts and totals-block.ts already apply. For a plain invoice (no
// original), the amount already IS the whole invoice.
export function correctedGrossAmountCents(
  isCorrection: boolean,
  isCreditNote: boolean,
  amount: number,
  originalAmount: number | null,
): number {
  if (!isCorrection || originalAmount === null) return amount;
  return originalAmount + (isCreditNote ? -amount : amount);
}
