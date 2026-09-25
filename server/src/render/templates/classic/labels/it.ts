import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

// Every document noun is feminine (fattura, nota di credito/debito) except
// "il preventivo" and "il documento di trasporto".
const IT_MASCULINE_TYPES = new Set<DocumentType>(['quote', 'delivery_note']);
const agree = (documentType: DocumentType, feminine: string, masculine: string) =>
  IT_MASCULINE_TYPES.has(documentType) ? masculine : feminine;

export const it: ClassicLabels = {
  companyIdLabel: 'Codice fiscale',
  recipientTitle: 'Destinatario:',
  vatNumberPrefix: 'P. IVA: ',
  molPrefix: 'Rappresentante: ',
  issuedAtPrefix: 'Data di emissione: ',
  taxEventPrefix: 'Data di effettuazione: ',
  validUntilPrefix: (documentType) => agree(documentType, 'Valida fino al: ', 'Valido fino al: '),
  deliveryDatePrefix: 'Data di consegna: ',
  transportReasonPrefix: 'Causale del trasporto: ',
  transportedAtPrefix: 'Data e ora di inizio del trasporto: ',
  carrierNamePrefix: 'Vettore: ',
  transportNotePrefix: 'Dati del trasporto: ',
  statusPaid: (documentType) => agree(documentType, 'Stato: PAGATA', 'Stato: PAGATO'),
  statusCancelled: (documentType) => agree(documentType, 'Stato: ANNULLATA', 'Stato: ANNULLATO'),
  phonePrefix: 'Tel.: ',
  bicPrefix: 'BIC: ',
  preparedByPrefix: (documentType) => agree(documentType, 'Emessa da: ', 'Emesso da: '),
  recipientSignaturePrefix: (documentType) => agree(documentType, 'Ricevuta da: ', 'Ricevuto da: '),
  colName: 'Descrizione',
  colQuantity: 'Quantità',
  colPrice: 'Prezzo',
  colTotal: 'Totale',
  vatBasePrefix: 'Imponibile:',
  vatRatePrefix: (percent) => `IVA (${percent}%):`,
  subtotalLabel: 'Subtotale:',
  discountRowLabel: (percent, customLabel) =>
    `Sconto${percent !== null ? ` (${percent}%)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Totale:',
  dueLabel: 'Totale da pagare:',
  exemptionPrefix: "Natura dell'operazione: ",
  originalMarker: ' (Originale)',
  draftLabel: 'Bozza',
  correctsInvoice: (number, date) => `Riferita alla fattura n. ${number} del ${date}`,
  documentType: {
    invoice: 'Fattura',
    proforma: 'Fattura proforma',
    credit_note: 'Nota di credito',
    debit_note: 'Nota di debito',
    quote: 'Preventivo',
    delivery_note: 'Documento di trasporto (DDT)',
  },
  watermarkMain: 'BOZZA',
  watermarkSub: 'DOCUMENTO NON VALIDO AI FINI FISCALI',
};
