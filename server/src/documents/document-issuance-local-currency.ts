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

// RO Codul fiscal art. 282 alin. (9)/(10) + Norme metodologice pct. 35 alin.
// (2); PL follows the same KIS-accepted practice: a correction reuses the
// original invoice's own snapshot rate rather than fetching a fresh one for
// the correction's own (possibly much later) date.
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
    (localCountry.rateSource === 'NBP' || localCountry.rateSource === 'BNR') &&
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
