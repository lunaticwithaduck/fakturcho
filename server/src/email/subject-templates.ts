import type { DocumentType } from '@fakturcho/shared-types';
import type { Locale } from './locale';

const DOCUMENT_LABELS: Record<Locale, Record<DocumentType, string>> = {
  bg: {
    invoice: 'Фактура',
    proforma: 'Проформа фактура',
    credit_note: 'Кредитно известие',
    debit_note: 'Дебитно известие',
    quote: 'Ценова оферта',
  },
  en: {
    invoice: 'Invoice',
    proforma: 'Proforma invoice',
    credit_note: 'Credit note',
    debit_note: 'Debit note',
    quote: 'Quote',
  },
};

const NUMBER_MARKER: Record<Locale, string> = {
  bg: '№',
  en: 'No.',
};

export function buildDocumentSubject(
  locale: Locale,
  documentType: DocumentType,
  formattedNumber: string | null,
): string {
  const label = DOCUMENT_LABELS[locale][documentType];
  if (formattedNumber === null) return label;
  return `${label} ${NUMBER_MARKER[locale]} ${formattedNumber}`;
}
