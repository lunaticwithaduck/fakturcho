import { eurCentsToBgnCents, roundHalfUp, type VatCategory } from '@fakturcho/shared-types';
import type { Document, LineItem } from '@prisma/client';
import { amountInWords } from '../../../money/amount-in-words';
import { formatCentsForLocale, formatMoneyForLocale } from '../../../money/format';
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

function mixedVatBlock(
  document: Document,
  lineItems: readonly LineItem[],
  labels: ClassicLabels,
  language: ClassicLanguage,
): { rows: string; exemptionGround: string | null } {
  const groups = discountAdjustedVatGroups(document, lineItems);
  const rows = groups
    .filter((group) => group.rateBp > 0)
    .map(
      (group) =>
        totalsRow(labels.vatBasePrefix, formatMoneyForLocale(group.taxableAmount, language)) +
        totalsRow(
          labels.vatRatePrefix(group.rateBp / 100),
          formatMoneyForLocale(group.vatAmount, language),
        ),
    )
    .join('');
  const exemptionGround = groups.some((group) => group.rateBp === 0)
    ? document.vatExemptionGround
    : null;
  return { rows, exemptionGround };
}

export function buildTotalsBlock(
  document: Document,
  lineItems: readonly LineItem[],
  presentation: VatPresentation,
  showBgnSuffix: boolean,
  locale: ClassicLocaleContext,
): string {
  const { labels, language } = locale;
  const isMixed =
    new Set(lineItems.map((line) => `${line.vatCategory}:${line.vatRateBp}`)).size > 1;

  let vatRows: string;
  let exemptionGround: string | null;
  if (isMixed) {
    const mixed = mixedVatBlock(document, lineItems, labels, language);
    vatRows = mixed.rows;
    exemptionGround = mixed.exemptionGround;
  } else {
    const base = document.subtotal - document.discountTotal;
    vatRows = presentation.vatCharged
      ? totalsRow(labels.vatBasePrefix, formatMoneyForLocale(base, language)) +
        totalsRow(
          labels.vatRatePrefix(document.vatRateBp / 100),
          formatMoneyForLocale(document.vatAmount, language),
        )
      : '';
    exemptionGround = presentation.showExemptionLine ? presentation.exemptionGround : null;
  }

  const bgnSuffix = showBgnSuffix
    ? ` / ${formatCentsForLocale(eurCentsToBgnCents(document.amount), language)} лв.`
    : '';
  const dueValue = `${formatMoneyForLocale(document.amount, language)}${bgnSuffix}`;
  const totals = `<div class="totals">
    ${vatRows}
    ${totalsRow(labels.totalLabel, formatMoneyForLocale(document.amount, language), 'totals-row total')}
    ${totalsRow(labels.dueLabel, dueValue, 'totals-row due')}
  </div>`;
  const exemption = exemptionGround
    ? `<div class="exemption">${labels.exemptionPrefix}${escapeHtml(exemptionGround)}</div>`
    : '';
  return `${totals}${exemption}`;
}
