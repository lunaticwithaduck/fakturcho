import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

const DE_PLAIN_RECIPIENT_TYPES = new Set<DocumentType>(['quote', 'delivery_note']);
const DE_PLAIN_DATE_TYPES = new Set<DocumentType>(['delivery_note', 'proforma']);

export const de: ClassicLabels = {
  companyIdLabel: 'Handelsregisternummer',
  supplierTitle: 'Rechnungssteller:',
  recipientTitle: (documentType) =>
    DE_PLAIN_RECIPIENT_TYPES.has(documentType) ? 'Empfänger:' : 'Rechnungsempfänger:',
  vatNumberPrefix: 'USt-IdNr.: ',
  molPrefix: 'Vertreten durch: ',
  issuedAtPrefix: (documentType) =>
    documentType === 'quote'
      ? 'Angebotsdatum: '
      : DE_PLAIN_DATE_TYPES.has(documentType)
        ? 'Datum: '
        : 'Rechnungsdatum: ',
  taxEventPrefix: 'Leistungsdatum: ',
  validUntilPrefix: () => 'Gültig bis: ',
  deliveryDatePrefix: 'Lieferdatum: ',
  transportReasonPrefix: 'Transportgrund: ',
  transportedAtPrefix: 'Datum/Uhrzeit des Transports: ',
  carrierNamePrefix: 'Spediteur: ',
  transportNotePrefix: 'Transporthinweise: ',
  statusPaid: () => 'Status: BEZAHLT',
  statusCancelled: () => 'Status: STORNIERT',
  phonePrefix: 'Telefon: ',
  bicPrefix: 'BIC: ',
  preparedByPrefix: () => 'Erstellt von: ',
  recipientSignaturePrefix: () => 'Empfangen von: ',
  colName: 'Bezeichnung',
  colQuantity: 'Menge',
  colPrice: 'Preis',
  colTotal: 'Gesamt',
  vatBasePrefix: 'Nettobetrag:',
  vatRatePrefix: (percent) => `USt. (${percent}%):`,
  subtotalLabel: 'Zwischensumme:',
  discountRowLabel: (percent, customLabel) =>
    `Rabatt${percent !== null ? ` (${percent}%)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Gesamtbetrag:',
  dueLabel: 'Zu zahlender Betrag:',
  creditDueLabel: 'Erstattungsbetrag:',
  paidLabel: 'Bezahlter Betrag:',
  exemptionPrefix: 'Hinweis: ',
  proformaNotice: 'Dies ist keine Rechnung im Sinne des UStG.',
  reverseChargeNote: 'Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)',
  originalMarker: '',
  draftLabel: 'Entwurf',
  numberSign: 'Nr.',
  draftTitle: (l) => `${l} (Entwurf)`,
  correctsInvoice: (number, date) => `Zur Rechnung Nr. ${number} vom ${date}`,
  documentType: {
    invoice: 'Rechnung',
    proforma: 'Proforma-Rechnung',
    credit_note: 'Rechnungskorrektur',
    debit_note: 'Belastungsanzeige',
    quote: 'Angebot',
    delivery_note: 'Lieferschein',
  },
  watermarkMain: 'ENTWURF',
  watermarkSub: 'RECHTLICH NICHT GÜLTIG',
};
