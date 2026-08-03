import type { Document } from '@prisma/client';
import { formatDate } from '../../../money/format';
import { escapeHtml, line } from './html-utils';

export function buildRecipientBlock(document: Document): string {
  const rows = [
    document.recipientCompanyName
      ? `<div class="no-break">${escapeHtml(document.recipientCompanyName)}</div>`
      : '',
    document.recipientAddress ? `<div>${escapeHtml(document.recipientAddress)}</div>` : '',
    line('ЕИК: ', document.recipientEik),
    line('ДДС №: ', document.recipientVatNumber),
    line('МОЛ: ', document.recipientMol),
  ]
    .filter(Boolean)
    .join('');
  return `<div class="recipient"><div class="block-title">Получател:</div>${rows}</div>`;
}

export function buildDatesBlock(document: Document, isQuote: boolean): string {
  const issuedAt = document.issuedAt ? formatDate(document.issuedAt) : '—';
  const rows = [`<div>Дата на издаване: ${issuedAt}</div>`];
  if (isQuote) {
    const validUntil = document.validUntil ? formatDate(document.validUntil) : '—';
    rows.push(`<div>Валидно до: ${validUntil}</div>`);
  } else {
    const taxEventAt = document.taxEventAt ? formatDate(document.taxEventAt) : '—';
    rows.push(`<div>Данъчно събитие: ${taxEventAt}</div>`);
  }
  rows.push(buildStatusMarker(document.status));
  return `<div class="dates">${rows.join('')}</div>`;
}

function buildStatusMarker(status: string): string {
  if (status === 'PAID') return '<div class="status">Статус: ПЛАТЕНО</div>';
  if (status === 'CANCELLED') return '<div class="status">Статус: АНУЛИРАНА</div>';
  return '';
}
