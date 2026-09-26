import type { DocumentType } from '@fakturcho/shared-types';

export interface SeriesGroup {
  key: string;
  types: readonly DocumentType[];
}

const TAX_GROUP_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

// EU VAT Directive art. 226(2) + 219: a credit or debit note is itself an
// invoice, so by default it draws from the same sequential series as the
// invoice it is issued against, uniquely identifying every one of the three.
export function seriesGroupFor(documentType: DocumentType): SeriesGroup {
  const isCorrection = documentType === 'credit_note' || documentType === 'debit_note';
  if (documentType !== 'invoice' && !isCorrection) {
    return { key: documentType, types: [documentType] };
  }
  return { key: 'tax', types: TAX_GROUP_TYPES };
}
