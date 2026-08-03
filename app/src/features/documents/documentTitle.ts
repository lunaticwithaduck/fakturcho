import {
  DOCUMENT_TYPE_LABELS,
  formatDocumentNumber,
  TAX_DOCUMENT_TYPES,
} from '@fakturcho/shared-types';
import type { DocumentType } from '@shared/types';

export interface DocumentTitleInput {
  documentType: DocumentType;
  number: number | null;
  numberPrefix: string | null;
  numberSuffix: string | null;
}

export function formatDocumentTitle(input: DocumentTitleInput): string {
  const label = DOCUMENT_TYPE_LABELS[input.documentType];
  if (input.number === null) return `${label} — чернова`;
  const marker = TAX_DOCUMENT_TYPES[input.documentType] ? ' (Оригинал)' : '';
  const number = `${input.numberPrefix ?? ''}${formatDocumentNumber(input.number)}${input.numberSuffix ?? ''}`;
  return `${label} № ${number}${marker}`;
}
