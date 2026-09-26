import type { DocumentType } from '@fakturcho/shared-types';

export interface SeriesGroup {
  key: string;
  types: readonly DocumentType[];
}

const TAX_GROUP_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];
const ES_CORRECTION_TYPES: readonly DocumentType[] = ['credit_note', 'debit_note'];

// EU VAT Directive art. 226(2) + 219: a credit or debit note is itself an
// invoice, so by default it draws from the same sequential series as the
// invoice it is issued against, uniquely identifying every one of the three.
// RD 1619/2012 art. 6.1.a and 15.5: Spain keeps rectificativas (credit and
// debit notes) in their own specific series, separate from invoices.
export function seriesGroupFor(documentType: DocumentType, country: string | null): SeriesGroup {
  const isCorrection = documentType === 'credit_note' || documentType === 'debit_note';
  if (documentType !== 'invoice' && !isCorrection) {
    return { key: documentType, types: [documentType] };
  }
  if (country === 'ES') {
    return isCorrection
      ? { key: 'es_correction', types: ES_CORRECTION_TYPES }
      : { key: 'tax', types: ['invoice'] };
  }
  return { key: 'tax', types: TAX_GROUP_TYPES };
}
