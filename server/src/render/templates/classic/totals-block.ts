import { eurCentsToBgnCents } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { amountInWords } from '../../../money/amount-in-words';
import { formatBgn, formatEur } from '../../../money/format';
import type { VatPresentation } from '../../../money/vat';
import { escapeHtml } from './html-utils';

export function buildAmountWordsBlock(document: Document): string {
  return `<div class="amount-words">${escapeHtml(amountInWords(document.amount))}</div>`;
}

function totalsRow(label: string, value: string, className = 'totals-row'): string {
  return `<div class="${className}"><span>${escapeHtml(label)}</span><span>${value}</span></div>`;
}

export function buildTotalsBlock(
  document: Document,
  presentation: VatPresentation,
  dualDisplayActive: boolean,
): string {
  const base = document.subtotal - document.discountTotal;
  const vatRows = presentation.vatCharged
    ? totalsRow('Данъчна основа:', formatEur(base)) +
      totalsRow(`ДДС (${document.vatRateBp / 100}%):`, formatEur(document.vatAmount))
    : '';
  const bgnSuffix = dualDisplayActive ? ` / ${formatBgn(eurCentsToBgnCents(document.amount))}` : '';
  const dueValue = `${formatEur(document.amount)}${bgnSuffix}`;
  const totals = `<div class="totals">
    ${vatRows}
    ${totalsRow('Общо:', formatEur(document.amount), 'totals-row total')}
    ${totalsRow('Сума за плащане:', dueValue, 'totals-row due')}
  </div>`;
  const exemption =
    presentation.showExemptionLine && presentation.exemptionGround
      ? `<div class="exemption">Основание за неначисляване на ДДС: ${escapeHtml(presentation.exemptionGround)}</div>`
      : '';
  return `${totals}${exemption}`;
}
