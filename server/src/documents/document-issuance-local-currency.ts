import type { DocumentType, VatCategory } from '@fakturcho/shared-types';
import { nonEuroVatCountry, roundHalfUp } from '@fakturcho/shared-types';
import type { Document as PrismaDocument, LineItem as PrismaLineItem } from '@prisma/client';
import type { ExchangeRateService } from '../vat-eu/exchange-rate.service';
import {
  applyReusedLocalCurrencyRate,
  type LocalCurrencyVatGroup,
  type LocalCurrencyVatSnapshot,
  resolveLocalCurrencyVatSnapshot,
} from '../vat-eu/local-currency-vat';
import { computeVatSubtotals } from '../vat-eu/subtotals';

// Same discount-proportioning + grouping the totals-block.ts render path uses
// (discountAdjustedVatGroups), kept as its own copy here since this domain
// service has no business importing the render module — only the charged
// rate/amount pairs are needed, merged across VAT categories that share a
// rate, to snapshot the local-currency VAT split at issuance time.
function issuanceVatGroups(
  document: Pick<PrismaDocument, 'subtotal' | 'discountTotal'>,
  lineItems: readonly PrismaLineItem[],
): LocalCurrencyVatGroup[] {
  const { subtotal, discountTotal } = document;
  const discountedLines = lineItems.map((line) => ({
    lineTotal:
      discountTotal === 0 || subtotal === 0
        ? line.lineTotal
        : line.lineTotal - roundHalfUp((line.lineTotal * discountTotal) / subtotal, 0),
    vatRateBp: line.vatRateBp,
    vatCategory: line.vatCategory as VatCategory,
  }));
  const byRate = new Map<number, number>();
  for (const group of computeVatSubtotals(discountedLines)) {
    if (group.rateBp <= 0) continue;
    byRate.set(group.rateBp, (byRate.get(group.rateBp) ?? 0) + group.vatAmount);
  }
  return Array.from(byRate.entries()).map(([rateBp, vatAmount]) => ({ rateBp, vatAmount }));
}

export interface IssuanceLocalCurrencyVatInput {
  documentType: DocumentType;
  issuerCountry: string | null;
  currency: string;
  vatAmount: number;
  taxEventAt: Date | null;
  issuedAt: Date;
  subtotal: number;
  discountTotal: number;
  lineItems: readonly PrismaLineItem[];
  isCorrection: boolean;
  originalDocument: PrismaDocument | null;
}

// A correction (credit_note/debit_note with an original) reuses the original
// invoice's own snapshot rate rather than fetching a fresh one for the
// correction's own (possibly much later) date, in every state whose law ties
// the applicable rate to the (unchanged) original supply/tax point:
// - PL: art. 106j + KIS-accepted practice.
// - RO: Codul fiscal art. 282 alin. (9)/(10) + Norme metodologice pct. 35
//   alin. (2).
// - CZ: zákon č. 235/2004 Sb. §42 odst. 7 písm. a) a §43 odst. 3 — the
//   corrective document uses the rate applied to the original taxable
//   supply, not a new one.
// - HU: 2007. évi CXXVII. törvény (Áfa tv.) §80 (1) b) — "a számla
//   kibocsátásakor [érvényes árfolyam]" means the ORIGINAL invoice's issue
//   date; a helyesbítő/jóváíró számla does not create a new teljesítés
//   (tax point), so the rate cannot change either.
// - SE: mervärdesskattelagen, per Skatteverket's rättslig vägledning
//   "Omräkningskurs vid beräkning av beskattningsunderlag" — the rate
//   follows skattskyldighetens inträde (the tax point), which a
//   kreditfaktura/ändringsfaktura correcting the same supply does not move.
// DK is deliberately NOT included: SKAT's Den juridiske vejledning
// (E.B.2.6.3/F.A.10.8) converts at the taxpayer's chosen periodic ECB rate
// (e.g. the rate on the last day of the return period), not a rate fixed to
// the individual original invoice, so there is no original rate to reuse.
const RATE_REUSE_ON_CORRECTION_COUNTRIES = new Set(['PL', 'RO', 'CZ', 'HU', 'SE']);

export async function resolveIssuanceLocalCurrencyVat(
  input: IssuanceLocalCurrencyVatInput,
  exchangeRateService: ExchangeRateService,
): Promise<LocalCurrencyVatSnapshot | null> {
  const localCountry = nonEuroVatCountry(input.issuerCountry ?? '');
  const vatGroups = issuanceVatGroups(input, input.lineItems);
  const original = input.originalDocument;
  const reusableOriginalRate =
    input.isCorrection &&
    localCountry &&
    RATE_REUSE_ON_CORRECTION_COUNTRIES.has(input.issuerCountry ?? '') &&
    original?.localCurrency &&
    original.exchangeRate &&
    original.exchangeRateDate &&
    original.exchangeRateSource
      ? original
      : null;

  if (reusableOriginalRate) {
    return applyReusedLocalCurrencyRate({
      localCurrency: reusableOriginalRate.localCurrency as string,
      exchangeRate: reusableOriginalRate.exchangeRate as string,
      exchangeRateDate: reusableOriginalRate.exchangeRateDate as Date,
      exchangeRateSource: reusableOriginalRate.exchangeRateSource as 'NBP' | 'BNR' | 'ECB',
      exchangeRateTable: reusableOriginalRate.exchangeRateTable,
      vatAmount: input.vatAmount,
      vatGroups,
    });
  }

  return resolveLocalCurrencyVatSnapshot(
    {
      documentType: input.documentType,
      issuerCountry: input.issuerCountry,
      currency: input.currency,
      vatAmount: input.vatAmount,
      taxEventAt: input.taxEventAt,
      issuedAt: input.issuedAt,
      vatGroups,
    },
    exchangeRateService,
  );
}
