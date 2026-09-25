import {
  type DocumentType,
  getCountryConfig,
  roundHalfUp,
  type VatCategory,
} from '@fakturcho/shared-types';
import type { Discount, Document, LineItem } from '@prisma/client';
import { amountInWords } from '../../../money/amount-in-words';
import { formatMoneyForLocale } from '../../../money/format';
import type { VatPresentation } from '../../../money/vat';
import { computeVatSubtotals } from '../../../vat-eu/subtotals';
import { escapeHtml } from './html-utils';
import type { ClassicLabels, ClassicLanguage } from './labels';
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
  labels: ClassicLabels,
  language: ClassicLanguage,
  sign: 1 | -1,
): { rows: string; exemptionGround: string | null } {
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
  return { rows, exemptionGround };
}

function dueRow(
  document: Document,
  documentType: DocumentType,
  labels: ClassicLabels,
  dueValue: string,
): string {
  if (documentType === 'quote') return '';
  const label =
    documentType === 'credit_note'
      ? labels.creditDueLabel
      : document.status === 'PAID'
        ? labels.paidLabel
        : labels.dueLabel;
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
  const sign = documentType === 'credit_note' ? -1 : 1;
  const isMixed =
    new Set(lineItems.map((line) => `${line.vatCategory}:${line.vatRateBp}`)).size > 1;

  let vatRows: string;
  let exemptionGround: string | null;
  if (isMixed) {
    const mixed = mixedVatBlock(document, lineItems, labels, language, sign);
    vatRows = mixed.rows;
    exemptionGround = mixed.exemptionGround;
  } else {
    const base = document.subtotal - document.discountTotal;
    vatRows = presentation.vatCharged
      ? totalsRow(labels.vatBasePrefix, formatMoneyForLocale(base * sign, language)) +
        totalsRow(
          labels.vatRatePrefix(document.vatRateBp / 100),
          formatMoneyForLocale(document.vatAmount * sign, language),
        )
      : '';
    exemptionGround = presentation.showExemptionLine ? presentation.exemptionGround : null;
  }

  const dueValue = formatMoneyForLocale(document.amount * sign, language);
  const totals = `<div class="totals">
    ${discountRows(document, discounts, labels, language, sign) + vatRows}
    ${totalsRow(labels.totalLabel, formatMoneyForLocale(document.amount * sign, language), 'totals-row total')}
    ${dueRow(document, documentType, labels, dueValue)}
  </div>`;
  const noteGrounds = getCountryConfig(locale.issuerCountry).vatNoteGrounds ?? [];
  const isNote = exemptionGround != null && noteGrounds.includes(exemptionGround);
  const exemption = exemptionGround
    ? `<div class="exemption">${isNote ? '' : labels.exemptionPrefix}${escapeHtml(exemptionGround)}</div>`
    : '';
  const proformaNotice =
    documentType === 'proforma' ? `<div class="exemption">${labels.proformaNotice}</div>` : '';
  return `${totals}${exemption}${proformaNotice}`;
}
