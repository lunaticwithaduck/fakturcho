import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

const DE_PLAIN_DATE_TYPES = new Set<DocumentType>(['delivery_note', 'proforma', 'credit_note']);

export const de: ClassicLabels = {
  companyIdLabel: 'Handelsregisternummer',
  supplierTitle: 'Aussteller:',
  recipientTitle: (documentType) => {
    if (documentType === 'delivery_note') return 'Lieferanschrift:';
    if (documentType === 'quote' || documentType === 'proforma') return 'Empfänger:';
    return 'Rechnungsempfänger:';
  },
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
  colUnit: 'Einheit',
  colVatRate: 'USt.-Satz',
  colPrice: 'Einzelpreis (netto)',
  colTotal: 'Gesamtpreis (netto)',
  unitLabels: {
    C62: 'Stk.',
    H87: 'Stk.',
    HUR: 'Std.',
    DAY: 'Tg.',
    MON: 'Mon.',
    KGM: 'kg',
    MTR: 'm',
    MTK: 'm²',
    LTR: 'l',
    KMT: 'km',
    SET: 'Set',
  },
  reverseChargeLineMarker: '—',
  vatBasePrefix: 'Nettobetrag:',
  vatRatePrefix: (percent) => `USt. ${percent} %:`,
  subtotalLabel: 'Zwischensumme:',
  discountRowLabel: (percent, customLabel) =>
    `Rabatt${percent !== null ? ` (${percent} %)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Gesamtbetrag:',
  netValueLabel: 'Gesamtwert:',
  dueLabel: 'Zu zahlender Betrag:',
  creditDueLabel: 'Erstattungsbetrag:',
  paidLabel: 'Bezahlter Betrag:',
  exemptionPrefix: 'Hinweis: ',
  operationNaturePrefix: 'Art des Umsatzes: ',
  operationNatureLabels: {
    goods: 'Lieferung von Gegenständen',
    services: 'Erbringung einer Dienstleistung',
    mixed: 'Lieferung von Gegenständen und Erbringung einer Dienstleistung',
  },
  deliveryAddressPrefix: 'Lieferadresse: ',
  vatAmountLocalLine: ({ currencyLabel, amount, sourceLabel, rate, date, table }) =>
    `Umsatzsteuerbetrag in ${currencyLabel}: ${amount} (${sourceLabel}-Kurs ${rate} vom ${date}${table ? `, Tabelle Nr. ${table}` : ''})`,
  proformaNotice: 'Dies ist keine Rechnung im Sinne des UStG.',
  reverseChargeNote:
    'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)',
  originalMarker: '',
  draftLabel: 'Entwurf',
  numberSign: 'Nr.',
  draftTitle: (l) => `${l} (Entwurf)`,
  correctsInvoice: (number, date) => `Zur Rechnung Nr. ${number} vom ${date}`,
  correctionReasonPrefix: 'Grund der Korrektur: ',
  documentType: {
    invoice: 'Rechnung',
    proforma: 'Proforma-Rechnung',
    credit_note: 'Rechnungskorrektur',
    debit_note: 'Belastungsanzeige',
    quote: 'Angebot',
    delivery_note: 'Lieferschein',
  },
  watermarkMain: 'ENTWURF',
  watermarkSub: 'KEINE GÜLTIGE RECHNUNG',
  vatBaseWithRatePrefix: (percent) => `Nettobetrag ${percent} %:`,
  buyerReferencePrefix: 'Ihre Referenz: ',
  paymentTermsPrefix: 'Zahlungsbedingungen: ',
  correctionKsefNumberPrefix: 'KSeF-Nummer der korrigierten Rechnung: ',
};
