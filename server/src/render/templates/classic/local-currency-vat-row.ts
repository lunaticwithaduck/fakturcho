import type { Document } from '@prisma/client';
import {
  decimalSeparatorForLocale,
  formatCentsForLocale,
  formatDateForLocale,
} from '../../../money/format';
import { escapeHtml } from './html-utils';
import type { ClassicLabels, ClassicLanguage } from './labels';

// ECB has an official abbreviation in every EU language; NBP and BNR are kept
// as their own national acronyms, the way PL and RO invoices refer to them.
const ECB_LABEL: Record<ClassicLanguage, string> = {
  bg: 'ЕЦБ',
  en: 'ECB',
  de: 'EZB',
  fr: 'BCE',
  it: 'BCE',
  pl: 'EBC',
  ro: 'BCE',
  es: 'BCE',
};

const CURRENCY_DISPLAY: Record<string, { label: string; symbol: string }> = {
  PLN: { label: 'PLN', symbol: 'zł' },
  RON: { label: 'lei', symbol: 'lei' },
  CZK: { label: 'CZK', symbol: 'Kč' },
  DKK: { label: 'DKK', symbol: 'kr.' },
  HUF: { label: 'HUF', symbol: 'Ft' },
  SEK: { label: 'SEK', symbol: 'kr' },
};

function sourceLabelFor(source: string, language: ClassicLanguage): string {
  return source === 'ECB' ? ECB_LABEL[language] : source;
}

function formatRateForLocale(rate: string, language: ClassicLanguage): string {
  return rate.replace('.', decimalSeparatorForLocale(language));
}

export function buildLocalCurrencyVatRow(
  document: Document,
  labels: ClassicLabels,
  language: ClassicLanguage,
  sign: 1 | -1,
): string {
  if (
    document.vatAmountLocal === null ||
    !document.localCurrency ||
    !document.exchangeRate ||
    !document.exchangeRateDate ||
    !document.exchangeRateSource
  ) {
    return '';
  }
  const currencyDisplay = CURRENCY_DISPLAY[document.localCurrency] ?? {
    label: document.localCurrency,
    symbol: document.localCurrency,
  };
  const amount = `${formatCentsForLocale(document.vatAmountLocal * sign, language)} ${currencyDisplay.symbol}`;
  const line = labels.vatAmountLocalLine({
    currencyLabel: currencyDisplay.label,
    amount,
    sourceLabel: sourceLabelFor(document.exchangeRateSource, language),
    rate: formatRateForLocale(document.exchangeRate, language),
    date: formatDateForLocale(document.exchangeRateDate, language),
    table: document.exchangeRateTable,
  });
  return `<div class="totals-row vat-local-currency"><span>${escapeHtml(line)}</span></div>`;
}
