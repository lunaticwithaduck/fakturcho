import { eurCentsToBgnCents } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { amountInWords } from '../../../money/amount-in-words';
import { formatCentsForLocale, formatMoneyForLocale } from '../../../money/format';
import type { VatPresentation } from '../../../money/vat';
import { escapeHtml } from './html-utils';
import type { ClassicLocaleContext } from './locale';

export function buildAmountWordsBlock(document: Document, locale: ClassicLocaleContext): string {
  if (locale.language !== 'bg') return '';
  return `<div class="amount-words">${escapeHtml(amountInWords(document.amount))}</div>`;
}

function totalsRow(label: string, value: string, className = 'totals-row'): string {
  return `<div class="${className}"><span>${escapeHtml(label)}</span><span>${value}</span></div>`;
}

export function buildTotalsBlock(
  document: Document,
  presentation: VatPresentation,
  showBgnSuffix: boolean,
  locale: ClassicLocaleContext,
): string {
  const { labels, language } = locale;
  const base = document.subtotal - document.discountTotal;
  const vatRows = presentation.vatCharged
    ? totalsRow(labels.vatBasePrefix, formatMoneyForLocale(base, language)) +
      totalsRow(
        labels.vatRatePrefix(document.vatRateBp / 100),
        formatMoneyForLocale(document.vatAmount, language),
      )
    : '';
  const bgnSuffix = showBgnSuffix
    ? ` / ${formatCentsForLocale(eurCentsToBgnCents(document.amount), language)} лв.`
    : '';
  const dueValue = `${formatMoneyForLocale(document.amount, language)}${bgnSuffix}`;
  const totals = `<div class="totals">
    ${vatRows}
    ${totalsRow(labels.totalLabel, formatMoneyForLocale(document.amount, language), 'totals-row total')}
    ${totalsRow(labels.dueLabel, dueValue, 'totals-row due')}
  </div>`;
  const exemption =
    presentation.showExemptionLine && presentation.exemptionGround
      ? `<div class="exemption">${labels.exemptionPrefix}${escapeHtml(presentation.exemptionGround)}</div>`
      : '';
  return `${totals}${exemption}`;
}
