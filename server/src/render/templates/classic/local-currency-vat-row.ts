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

interface LocalVatRateBreakdown {
  rateBp: number;
  vatAmountLocal: number;
}

function readVatAmountLocalByRate(document: Document): LocalVatRateBreakdown[] | null {
  const value = document.vatAmountLocalByRate;
  if (!Array.isArray(value) || value.length <= 1) return null;
  return value as unknown as LocalVatRateBreakdown[];
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
  const sourceLabel = sourceLabelFor(document.exchangeRateSource, language);
  const rate = formatRateForLocale(document.exchangeRate, language);
  const date = formatDateForLocale(document.exchangeRateDate, language);
  // PL art. 106e ust. 11 (pkt 14) / RO art. 319 alin. (20) lit. j): once the
  // document carries more than one charged rate, the local-currency VAT is
  // printed per rate rather than as a single total.
  const byRate = readVatAmountLocalByRate(document);
  const rows = byRate ?? [
    { rateBp: null as number | null, vatAmountLocal: document.vatAmountLocal },
  ];
  return rows
    .map(({ rateBp, vatAmountLocal }) => {
      const amount = `${formatCentsForLocale(vatAmountLocal * sign, language)} ${currencyDisplay.symbol}`;
      const currencyLabel =
        rateBp !== null ? `${currencyDisplay.label} (${rateBp / 100}%)` : currencyDisplay.label;
      const line = labels.vatAmountLocalLine({
        currencyLabel,
        amount,
        sourceLabel,
        rate,
        date,
        table: document.exchangeRateTable,
      });
      return `<div class="totals-row vat-local-currency"><span>${escapeHtml(line)}</span></div>`;
    })
    .join('');
}
