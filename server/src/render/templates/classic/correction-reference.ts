import { type DocumentType, formatDocumentNumber } from '@fakturcho/shared-types';
import { formatDateForLocale } from '../../../money/format';
import { escapeHtml } from './html-utils';
import type { ClassicLocaleContext } from './locale';

export interface OriginalDocumentRef {
  number: bigint | number | null;
  numberPrefix: string | null;
  numberSuffix: string | null;
  issuedAt: Date | null;
}

export function buildCorrectionReference(
  documentType: DocumentType,
  original: OriginalDocumentRef | null | undefined,
  locale: ClassicLocaleContext,
): string {
  if (documentType !== 'credit_note' && documentType !== 'debit_note') return '';
  if (!original || original.number === null) return '';
  const number = `${original.numberPrefix ?? ''}${formatDocumentNumber(Number(original.number))}${original.numberSuffix ?? ''}`;
  const date = original.issuedAt ? formatDateForLocale(original.issuedAt, locale.language) : '—';
  return `<div class="correction-reference">${escapeHtml(locale.labels.correctsInvoice(number, date))}</div>`;
}
