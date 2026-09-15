import type { DocumentType } from '@fakturcho/shared-types';
import type { Locale } from './locale';

const DOCUMENT_LABELS: Record<Locale, Record<DocumentType, string>> = {
  bg: {
    invoice: 'Фактура',
    proforma: 'Проформа фактура',
    credit_note: 'Кредитно известие',
    debit_note: 'Дебитно известие',
    quote: 'Ценова оферта',
    delivery_note: 'Стокова разписка',
  },
  en: {
    invoice: 'Invoice',
    proforma: 'Proforma invoice',
    credit_note: 'Credit note',
    debit_note: 'Debit note',
    quote: 'Quote',
    delivery_note: 'Delivery note',
  },
  de: {
    invoice: 'Rechnung',
    proforma: 'Proforma-Rechnung',
    credit_note: 'Rechnungskorrektur',
    debit_note: 'Belastungsanzeige',
    quote: 'Angebot',
    delivery_note: 'Lieferschein',
  },
  fr: {
    invoice: 'Facture',
    proforma: 'Facture pro forma',
    credit_note: 'Avoir',
    debit_note: 'Note de débit',
    quote: 'Devis',
    delivery_note: 'Bon de livraison',
  },
  it: {
    invoice: 'Fattura',
    proforma: 'Fattura proforma',
    credit_note: 'Nota di credito',
    debit_note: 'Nota di debito',
    quote: 'Preventivo',
    delivery_note: 'Documento di trasporto (DDT)',
  },
  pl: {
    invoice: 'Faktura',
    proforma: 'Faktura pro forma',
    credit_note: 'Faktura korygująca',
    debit_note: 'Nota debetowa',
    quote: 'Oferta',
    delivery_note: 'Dowód dostawy',
  },
  ro: {
    invoice: 'Factură',
    proforma: 'Factură proformă',
    credit_note: 'Notă de credit',
    debit_note: 'Notă de debit',
    quote: 'Ofertă',
    delivery_note: 'Aviz de însoțire a mărfii',
  },
  es: {
    invoice: 'Factura',
    proforma: 'Factura proforma',
    credit_note: 'Factura rectificativa (abono)',
    debit_note: 'Factura rectificativa (cargo)',
    quote: 'Presupuesto',
    delivery_note: 'Albarán',
  },
};

const NUMBER_MARKER: Record<Locale, string> = {
  bg: '№',
  en: 'No.',
  de: 'Nr.',
  fr: 'n°',
  it: 'n.',
  pl: 'nr',
  ro: 'nr.',
  es: 'n.º',
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
