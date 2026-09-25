import {
  type DocumentType,
  getCountryConfig,
  roundHalfUp,
  TAX_DOCUMENT_TYPES,
  type VatCategory,
} from '@fakturcho/shared-types';
import type { Discount, Document, LineItem } from '@prisma/client';
import { amountInWords } from '../../../money/amount-in-words';
import { formatMoneyForLocale } from '../../../money/format';
import type { VatPresentation } from '../../../money/vat';
import { computeVatSubtotals } from '../../../vat-eu/subtotals';
import { escapeHtml } from './html-utils';
import type { ClassicLabels, ClassicLanguage } from './labels';
import { buildLocalCurrencyVatRow } from './local-currency-vat-row';
import type { ClassicLocaleContext } from './locale';

export function buildAmountWordsBlock(document: Document, locale: ClassicLocaleContext): string {
  if (locale.language !== 'bg') return '';
  return `<div class="amount-words">${escapeHtml(amountInWords(document.amount))}</div>`;
}

function totalsRow(label: string, value: string, className = 'totals-row'): string {
  return `<div class="${className}"><span>${escapeHtml(label)}</span><span>${value}</span></div>`;
}

export function discountAdjustedVatGroups(document: Document, lineItems: readonly LineItem[]) {
  const { subtotal, discountTotal } = document;
  const lines = lineItems.map((line) => ({
    lineTotal:
      discountTotal === 0 || subtotal === 0
        ? line.lineTotal
        : line.lineTotal - roundHalfUp((line.lineTotal * discountTotal) / subtotal, 0),
    vatRateBp: line.vatRateBp,
    vatCategory: line.vatCategory as VatCategory,
  }));
  return computeVatSubtotals(lines);
}

function discountRows(
  document: Document,
  discounts: readonly Discount[],
  labels: ClassicLabels,
  language: ClassicLanguage,
  sign: 1 | -1,
): string {
  if (document.discountTotal <= 0) return '';
  const single = discounts.length === 1 ? discounts[0] : null;
  const percent = single?.percentBp != null ? single.percentBp / 100 : null;
  const customLabel = single?.label || null;
  return (
    totalsRow(labels.subtotalLabel, formatMoneyForLocale(document.subtotal * sign, language)) +
    totalsRow(
      labels.discountRowLabel(percent, customLabel),
      formatMoneyForLocale(-document.discountTotal * sign, language),
    )
  );
}

function mixedVatBlock(
  document: Document,
  lineItems: readonly LineItem[],
  locale: ClassicLocaleContext,
  documentType: DocumentType,
  sign: 1 | -1,
): { rows: string; exemptionGround: string | null } {
  const { labels, language } = locale;
  const groups = discountAdjustedVatGroups(document, lineItems);
  const rows = groups
    .filter((group) => group.rateBp > 0)
    .map(
      (group) =>
        totalsRow(
          labels.vatBasePrefix,
          formatMoneyForLocale(group.taxableAmount * sign, language),
        ) +
        totalsRow(
          labels.vatRatePrefix(group.rateBp / 100),
          formatMoneyForLocale(group.vatAmount * sign, language),
        ),
    )
    .join('');
  const exemptionGround = groups.some((group) => group.rateBp === 0)
    ? document.vatExemptionGround
    : null;
  const untaxedRows = groups
    .filter((group) => group.rateBp === 0)
    .map((group) =>
      untaxedBaseRows(document, documentType, exemptionGround, locale, group.taxableAmount * sign),
    )
    .join('');
  return { rows: rows + untaxedRows, exemptionGround };
}

function groundPrefix(ground: string, locale: ClassicLocaleContext): string {
  const config = getCountryConfig(locale.issuerCountry);
  if (config.vatNoteGrounds?.includes(ground)) return '';
  if (config.zeroRateGrounds?.includes(ground)) {
    return locale.labels.zeroRatePrefix ?? locale.labels.exemptionPrefix;
  }
  return locale.labels.exemptionPrefix;
}

function untaxedBaseRows(
  document: Document,
  documentType: DocumentType,
  ground: string | null,
  locale: ClassicLocaleContext,
  base: number,
): string {
  if (!document.issuerVatRegistered || !TAX_DOCUMENT_TYPES[documentType]) return '';
  const { labels, language } = locale;
  const baseRow = totalsRow(labels.vatBasePrefix, formatMoneyForLocale(base, language));
  const zeroRated =
    ground !== null && getCountryConfig(locale.issuerCountry).zeroRateGrounds?.includes(ground);
  return zeroRated
    ? baseRow + totalsRow(labels.vatRatePrefix(0), formatMoneyForLocale(0, language))
    : baseRow;
}

function dueRow(
  document: Document,
  documentType: DocumentType,
  labels: ClassicLabels,
  dueValue: string,
): string {
  if (documentType === 'quote') return '';
  if (documentType === 'credit_note') {
    const value = labels.creditDueLabel === labels.dueLabel ? dueValue : dueValue.replace('-', '');
    return totalsRow(labels.creditDueLabel, value, 'totals-row due');
  }
  const label = document.status === 'PAID' ? labels.paidLabel : labels.dueLabel;
  return totalsRow(label, dueValue, 'totals-row due');
}

export function buildTotalsBlock(
  document: Document,
  lineItems: readonly LineItem[],
  presentation: VatPresentation,
  locale: ClassicLocaleContext,
  documentType: DocumentType,
  discounts: readonly Discount[] = [],
): string {
  const { labels, language } = locale;
  if (documentType === 'delivery_note') {
    const shown = lineItems.reduce((sum, line) => sum + line.lineTotal, 0) - document.discountTotal;
    const value = formatMoneyForLocale(shown, language);
    return `<div class="totals">${totalsRow(labels.netValueLabel, value, 'totals-row total')}</div>`;
  }
  const sign = documentType === 'credit_note' ? -1 : 1;
  const isMixed =
    new Set(lineItems.map((line) => `${line.vatCategory}:${line.vatRateBp}`)).size > 1;

  let vatRows: string;
  let exemptionGround: string | null;
  if (isMixed) {
    const mixed = mixedVatBlock(document, lineItems, locale, documentType, sign);
    vatRows = mixed.rows;
    exemptionGround = mixed.exemptionGround;
  } else {
    const base = document.subtotal - document.discountTotal;
    exemptionGround = presentation.showExemptionLine ? presentation.exemptionGround : null;
    vatRows = presentation.vatCharged
      ? totalsRow(labels.vatBasePrefix, formatMoneyForLocale(base * sign, language)) +
        totalsRow(
          labels.vatRatePrefix(document.vatRateBp / 100),
          formatMoneyForLocale(document.vatAmount * sign, language),
        )
      : untaxedBaseRows(document, documentType, exemptionGround, locale, base * sign);
  }

  const dueValue = formatMoneyForLocale(document.amount * sign, language);
  const totalLabel =
    document.vatAmount !== 0 ? (labels.totalWithVatLabel ?? labels.totalLabel) : labels.totalLabel;
  const localCurrencyVatRow = buildLocalCurrencyVatRow(document, labels, language, sign);
  const totals = `<div class="totals">
    ${discountRows(document, discounts, labels, language, sign) + vatRows}
    ${localCurrencyVatRow}
    ${totalsRow(totalLabel, formatMoneyForLocale(document.amount * sign, language), 'totals-row total')}
    ${dueRow(document, documentType, labels, dueValue)}
  </div>`;
  const exemption = exemptionGround
    ? `<div class="exemption">${groundPrefix(exemptionGround, locale)}${escapeHtml(exemptionGround)}</div>`
    : '';
  const proformaNotice =
    documentType === 'proforma' ? `<div class="exemption">${labels.proformaNotice}</div>` : '';
  return `${totals}${exemption}${proformaNotice}`;
}
