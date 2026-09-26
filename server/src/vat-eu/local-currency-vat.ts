import {
  type DocumentType,
  nonEuroVatCountry,
  roundHalfUp,
  TAX_DOCUMENT_TYPES,
} from '@fakturcho/shared-types';
import { DomainError } from '../common/domain-error';
import type { ExchangeRateService } from './exchange-rate.service';

export interface LocalCurrencyVatRateBreakdown {
  rateBp: number;
  vatAmountLocal: number;
}

export interface LocalCurrencyVatSnapshot {
  localCurrency: string;
  exchangeRate: string;
  exchangeRateDate: Date;
  exchangeRateSource: 'NBP' | 'BNR' | 'ECB';
  exchangeRateTable: string | null;
  vatAmountLocal: number;
  // PL art. 106e ust. 11 (referring to pkt 14) and RO art. 319 alin. (20) lit.
  // j) both require the local-currency VAT split by rate, not one total. Only
  // set once there is more than one charged rate; a single-rate document
  // keeps the plain vatAmountLocal above, unchanged from before this existed.
  vatAmountLocalByRate: LocalCurrencyVatRateBreakdown[] | null;
}

export interface LocalCurrencyVatGroup {
  rateBp: number;
  vatAmount: number;
}

export interface LocalCurrencyVatInput {
  documentType: DocumentType;
  issuerCountry: string | null;
  currency: string;
  vatAmount: number;
  taxEventAt: Date | null;
  issuedAt: Date;
  // Charged VAT groups (rateBp > 0), one per distinct rate on the document,
  // used only to build vatAmountLocalByRate when there is more than one.
  vatGroups?: readonly LocalCurrencyVatGroup[];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayBefore(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 1));
}

function earlierOf(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

function buildVatAmountLocalByRate(
  vatGroups: readonly LocalCurrencyVatGroup[] | undefined,
  rate: string,
): LocalCurrencyVatRateBreakdown[] | null {
  const chargedGroups = (vatGroups ?? []).filter((group) => group.rateBp > 0);
  if (chargedGroups.length <= 1) return null;
  const byRate = new Map<number, number>();
  for (const group of chargedGroups) {
    byRate.set(group.rateBp, (byRate.get(group.rateBp) ?? 0) + group.vatAmount);
  }
  return Array.from(byRate.entries()).map(([rateBp, vatAmount]) => ({
    rateBp,
    vatAmountLocal: roundHalfUp(vatAmount * Number(rate), 0),
  }));
}

// RO and PL corrections (credit_note/debit_note with an original) must use the
// original invoice's own exchange rate, never a freshly fetched one (RO Codul
// fiscal art. 282 alin. (9)/(10) + Norme metodologice pct. 35 alin. (2); PL
// follows the same accepted KIS practice). This applies that already-known
// rate to the correction's own (possibly different) VAT amount and groups.
export function applyReusedLocalCurrencyRate(input: {
  localCurrency: string;
  exchangeRate: string;
  exchangeRateDate: Date;
  exchangeRateSource: 'NBP' | 'BNR' | 'ECB';
  exchangeRateTable: string | null;
  vatAmount: number;
  vatGroups?: readonly LocalCurrencyVatGroup[];
}): LocalCurrencyVatSnapshot {
  return {
    localCurrency: input.localCurrency,
    exchangeRate: input.exchangeRate,
    exchangeRateDate: input.exchangeRateDate,
    exchangeRateSource: input.exchangeRateSource,
    exchangeRateTable: input.exchangeRateTable,
    vatAmountLocal: roundHalfUp(input.vatAmount * Number(input.exchangeRate), 0),
    vatAmountLocalByRate: buildVatAmountLocalByRate(input.vatGroups, input.exchangeRate),
  };
}

// VAT Directive art. 230 + 91(2): only tax documents (invoice, credit_note,
// debit_note) carry a VAT amount that needs converting, only for issuers in a
// non-euro EU_VAT_AREA_COUNTRIES state, and only when there is VAT to convert.
export async function resolveLocalCurrencyVatSnapshot(
  input: LocalCurrencyVatInput,
  exchangeRateService: ExchangeRateService,
): Promise<LocalCurrencyVatSnapshot | null> {
  if (!TAX_DOCUMENT_TYPES[input.documentType]) return null;
  if (input.currency !== 'EUR' || input.vatAmount === 0) return null;
  if (!input.issuerCountry) return null;
  const localCountry = nonEuroVatCountry(input.issuerCountry);
  if (!localCountry) return null;

  const taxPointDate = input.taxEventAt ?? input.issuedAt;
  // PL (ustawa o VAT art. 31a ust. 1-2): last business day before the EARLIER
  // of the tax point and the issue date — an invoice issued before the sale
  // uses the issue date, not a tax point that hasn't happened yet.
  // RO (Codul fiscal art. 290 + Norme metodologice pct. 35 alin. (1)): the
  // rate BNR published the business day before the tax point; but art. 282
  // alin. (2) lit. a) makes the issue date itself the chargeability event
  // when the invoice is issued before the tax point, so the EARLIER of the
  // two governs here too.
  let rateAsOfDate: Date;
  if (localCountry.rateSource === 'NBP') {
    rateAsOfDate = dayBefore(earlierOf(taxPointDate, input.issuedAt));
  } else if (localCountry.rateSource === 'BNR') {
    rateAsOfDate = dayBefore(earlierOf(taxPointDate, input.issuedAt));
  } else {
    rateAsOfDate = taxPointDate;
  }
  const onOrBeforeDate = toIsoDate(rateAsOfDate);

  let quote: Awaited<ReturnType<ExchangeRateService['fetchRate']>>;
  try {
    quote = await exchangeRateService.fetchRate({
      source: localCountry.rateSource,
      currency: localCountry.currency,
      onOrBeforeDate,
    });
  } catch {
    quote = null;
  }

  if (!quote) {
    throw new DomainError(
      'EXCHANGE_RATE_UNAVAILABLE',
      `Could not fetch a ${localCountry.rateSource} exchange rate for ${localCountry.currency} on or before ${onOrBeforeDate}.`,
    );
  }

  return {
    localCurrency: localCountry.currency,
    exchangeRate: quote.rate,
    exchangeRateDate: new Date(`${quote.rateDate}T00:00:00.000Z`),
    exchangeRateSource: localCountry.rateSource,
    exchangeRateTable: quote.table,
    vatAmountLocal: roundHalfUp(input.vatAmount * Number(quote.rate), 0),
    vatAmountLocalByRate: buildVatAmountLocalByRate(input.vatGroups, quote.rate),
  };
}
