import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

// faktura/oferta/nota are feminine; the delivery note's "dowód" is masculine.
const agree = (documentType: DocumentType, feminine: string, masculine: string) =>
  documentType === 'delivery_note' ? masculine : feminine;

export const pl: ClassicLabels = {
  companyIdLabel: 'NIP',
  recipientTitle: 'Nabywca:',
  vatNumberPrefix: 'NIP UE: ',
  molPrefix: 'Reprezentant: ',
  issuedAtPrefix: 'Data wystawienia: ',
  taxEventPrefix: 'Data sprzedaży: ',
  validUntilPrefix: () => 'Ważna do: ',
  deliveryDatePrefix: 'Data dostawy: ',
  transportReasonPrefix: 'Powód transportu: ',
  transportedAtPrefix: 'Data i godzina transportu: ',
  carrierNamePrefix: 'Przewoźnik: ',
  transportNotePrefix: 'Szczegóły transportu: ',
  statusPaid: () => 'Status: ZAPŁACONO',
  statusCancelled: (documentType) => agree(documentType, 'Status: ANULOWANA', 'Status: ANULOWANY'),
  phonePrefix: 'Telefon: ',
  bicPrefix: 'BIC: ',
  preparedByPrefix: () => 'Wystawił: ',
  recipientSignaturePrefix: () => 'Odebrał: ',
  colName: 'Nazwa',
  colQuantity: 'Ilość',
  colPrice: 'Cena',
  colTotal: 'Wartość',
  vatBasePrefix: 'Wartość netto:',
  vatRatePrefix: (percent) => `VAT (${percent}%):`,
  subtotalLabel: 'Suma częściowa:',
  discountRowLabel: (percent, customLabel) =>
    `Rabat${percent !== null ? ` (${percent}%)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Razem:',
  dueLabel: 'Do zapłaty:',
  exemptionPrefix: 'Podstawa zwolnienia: ',
  originalMarker: '',
  draftLabel: 'Wersja robocza',
  correctsInvoice: (number, date) => `Dotyczy faktury nr ${number} z dnia ${date}`,
  // art. 106j ustawy o VAT: any correction of an invoiced amount, up or down, is
  // a faktura korygująca — a nota debetowa is not a VAT document.
  documentType: {
    invoice: 'Faktura',
    proforma: 'Faktura pro forma',
    credit_note: 'Faktura korygująca',
    debit_note: 'Faktura korygująca',
    quote: 'Oferta',
    delivery_note: 'Dowód dostawy',
  },
  watermarkMain: 'WERSJA ROBOCZA',
  watermarkSub: 'DOKUMENT BEZ MOCY PRAWNEJ',
};
