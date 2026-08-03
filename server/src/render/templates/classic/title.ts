import {
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
  formatDocumentNumber,
  TAX_DOCUMENT_TYPES,
} from '@fakturcho/shared-types';
import { escapeHtml } from './html-utils';

export function buildTitle(
  documentType: DocumentType,
  numberPrefix: string | null,
  number: number | null,
  numberSuffix: string | null,
): string {
  const label = DOCUMENT_TYPE_LABELS[documentType];
  if (number === null) {
    return escapeHtml(`${label} # Чернова`);
  }
  const marker = TAX_DOCUMENT_TYPES[documentType] ? ' (Оригинал)' : '';
  const padded = formatDocumentNumber(number);
  return escapeHtml(`${label} # ${numberPrefix ?? ''}${padded}${numberSuffix ?? ''}${marker}`);
}
