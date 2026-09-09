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

export type DocumentTitleTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const FALLBACK_TITLE_MESSAGES: Record<string, string> = {
  draft: '{label} — чернова',
  numbered: '{label} № {number}',
  originalMarker: ' (Оригинал)',
};

function fallbackTranslate(key: string, values?: Record<string, string | number>): string {
  const template = FALLBACK_TITLE_MESSAGES[key] ?? '';
  if (!values) return template;
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replace(`{${name}}`, String(value)),
    template,
  );
}

export function formatDocumentTitle(
  input: DocumentTitleInput,
  t: DocumentTitleTranslator = fallbackTranslate,
): string {
  const label = DOCUMENT_TYPE_LABELS[input.documentType];
  if (input.number === null) return t('draft', { label });
  const marker = TAX_DOCUMENT_TYPES[input.documentType] ? t('originalMarker') : '';
  const number = `${input.numberPrefix ?? ''}${formatDocumentNumber(input.number)}${input.numberSuffix ?? ''}`;
  return `${t('numbered', { label, number })}${marker}`;
}
