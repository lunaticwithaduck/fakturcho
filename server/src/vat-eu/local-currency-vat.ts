import {
  type DocumentType,
  nonEuroVatCountry,
  roundHalfUp,
  TAX_DOCUMENT_TYPES,
} from '@fakturcho/shared-types';
import { DomainError } from '../common/domain-error';
import type { ExchangeRateService } from './exchange-rate.service';

export interface LocalCurrencyVatSnapshot {
  localCurrency: string;
  exchangeRate: string;
  exchangeRateDate: Date;
  exchangeRateSource: 'NBP' | 'BNR' | 'ECB';
  exchangeRateTable: string | null;
  vatAmountLocal: number;
}

export interface LocalCurrencyVatInput {
  documentType: DocumentType;
  issuerCountry: string | null;
  currency: string;
  vatAmount: number;
  taxEventAt: Date | null;
  issuedAt: Date;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayBefore(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 1));
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
  const onOrBeforeDate = toIsoDate(
    localCountry.rateSource === 'NBP' ? dayBefore(taxPointDate) : taxPointDate,
  );

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
  };
}
