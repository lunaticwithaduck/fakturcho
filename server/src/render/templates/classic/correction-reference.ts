import { type DocumentType, formatDocumentNumber } from '@fakturcho/shared-types';
import { formatDateForLocale } from '../../../money/format';
import { escapeHtml } from './html-utils';
import type { ClassicLocaleContext } from './locale';

export interface OriginalDocumentRef {
  number: bigint | number | null;
  numberPrefix: string | null;
  numberSuffix: string | null;
  issuedAt: Date | null;
  ksefNumber?: string | null;
  // PL art. 108a ust. 1a: the corrected (post-correction) gross total needs
  // the original invoice's own gross amount (mentions/pl.ts).
  amount?: number | null;
}

export function buildCorrectionReference(
  documentType: DocumentType,
  original: OriginalDocumentRef | null | undefined,
  reason: string | null | undefined,
  locale: ClassicLocaleContext,
): string {
  if (documentType !== 'credit_note' && documentType !== 'debit_note') return '';
  if (!original || original.number === null) return '';
  const number = `${original.numberPrefix ?? ''}${formatDocumentNumber(Number(original.number))}${original.numberSuffix ?? ''}`;
  const date = original.issuedAt ? formatDateForLocale(original.issuedAt, locale.language) : '—';
  const referenceLine = `<div class="correction-reference">${escapeHtml(locale.labels.correctsInvoice(number, date))}</div>`;
  // art. 106j ustawy o VAT: a correction of a KSeF-submitted invoice carries
  // that invoice's KSeF number in the FA(3) export (fa3-mapper.ts); print it
  // here so the PDF and the XML agree.
  const ksefLine = original.ksefNumber
    ? `<div class="correction-ksef">${escapeHtml(locale.labels.correctionKsefNumberPrefix + original.ksefNumber)}</div>`
    : '';
  const reasonLine = reason
    ? `<div class="correction-reason">${escapeHtml(locale.labels.correctionReasonPrefix + reason)}</div>`
    : '';
  return referenceLine + ksefLine + reasonLine;
}
