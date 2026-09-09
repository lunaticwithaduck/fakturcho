import type { Document } from '@prisma/client';
import { formatDateForLocale } from '../../../money/format';
import { escapeHtml, line } from './html-utils';
import type { ClassicLabels } from './labels';
import type { ClassicLocaleContext } from './locale';

export function buildRecipientBlock(document: Document, locale: ClassicLocaleContext): string {
  const { labels } = locale;
  const rows = [
    document.recipientCompanyName
      ? `<div class="no-break">${escapeHtml(document.recipientCompanyName)}</div>`
      : '',
    document.recipientAddress ? `<div>${escapeHtml(document.recipientAddress)}</div>` : '',
    line(`${labels.companyIdLabel}: `, document.recipientEik),
    line(labels.vatNumberPrefix, document.recipientVatNumber),
    locale.showMol ? line(labels.molPrefix, document.recipientMol) : '',
  ]
    .filter(Boolean)
    .join('');
  return `<div class="recipient"><div class="block-title">${labels.recipientTitle}</div>${rows}</div>`;
}

export function buildDatesBlock(
  document: Document,
  isQuote: boolean,
  locale: ClassicLocaleContext,
): string {
  const { labels } = locale;
  const issuedAt = document.issuedAt
    ? formatDateForLocale(document.issuedAt, locale.language)
    : '—';
  const rows = [`<div>${labels.issuedAtPrefix}${issuedAt}</div>`];
  if (isQuote) {
    const validUntil = document.validUntil
      ? formatDateForLocale(document.validUntil, locale.language)
      : '—';
    rows.push(`<div>${labels.validUntilPrefix}${validUntil}</div>`);
  } else {
    const taxEventAt = document.taxEventAt
      ? formatDateForLocale(document.taxEventAt, locale.language)
      : '—';
    rows.push(`<div>${labels.taxEventPrefix}${taxEventAt}</div>`);
  }
  rows.push(buildStatusMarker(document.status, labels));
  return `<div class="dates">${rows.join('')}</div>`;
}

function buildStatusMarker(status: string, labels: ClassicLabels): string {
  if (status === 'PAID') return `<div class="status">${labels.statusPaid}</div>`;
  if (status === 'CANCELLED') return `<div class="status">${labels.statusCancelled}</div>`;
  return '';
}
