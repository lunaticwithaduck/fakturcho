import {
  type DocumentType,
  formatDocumentNumber,
  TAX_DOCUMENT_TYPES,
} from '@fakturcho/shared-types';
import { escapeHtml } from './html-utils';
import type { ClassicLocaleContext } from './locale';

export function buildTitle(
  documentType: DocumentType,
  numberPrefix: string | null,
  number: number | null,
  numberSuffix: string | null,
  locale: ClassicLocaleContext,
): string {
  const label = locale.labels.documentType[documentType];
  if (number === null) {
    return escapeHtml(locale.labels.draftTitle(label));
  }
  const marker =
    locale.showOriginalStamp && TAX_DOCUMENT_TYPES[documentType]
      ? locale.labels.originalMarker
      : '';
  const padded = formatDocumentNumber(number);
  return escapeHtml(
    `${label} ${locale.labels.numberSign} ${numberPrefix ?? ''}${padded}${numberSuffix ?? ''}${marker}`,
  );
}
