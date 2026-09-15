import type { DocumentDto } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';

export function invoiceSeriesNumber(document: DocumentDto): string {
  const documentNumber = document.number !== null ? formatDocumentNumber(document.number) : '';
  return `${document.numberPrefix ?? ''}${documentNumber}${document.numberSuffix ?? ''}`;
}
