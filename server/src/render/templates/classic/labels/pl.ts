import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

// faktura/oferta/nota are feminine; the delivery note's "dowód" is masculine.
const agree = (documentType: DocumentType, feminine: string, masculine: string) =>
  documentType === 'delivery_note' ? masculine : feminine;

const PL_RECIPIENT_TITLES: Partial<Record<DocumentType, string>> = {
  quote: 'Klient:',
  delivery_note: 'Odbiorca:',
};

export const pl: ClassicLabels = {
  companyIdLabel: 'NIP',
  supplierTitle: 'Sprzedawca:',
  recipientTitle: (documentType) => PL_RECIPIENT_TITLES[documentType] ?? 'Nabywca:',
  vatNumberPrefix: 'NIP UE: ',
  molPrefix: 'Reprezentant: ',
  issuedAtPrefix: () => 'Data wystawienia: ',
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
  colUnit: 'Miara',
  colVatRate: 'Stawka VAT',
  colPrice: 'Cena jedn. netto',
  colTotal: 'Wartość netto',
  unitLabels: {
    C62: 'szt.',
    H87: 'szt.',
    HUR: 'godz.',
    DAY: 'dni',
    MON: 'mies.',
    KGM: 'kg',
    MTR: 'm',
    MTK: 'm²',
    LTR: 'l',
    KMT: 'km',
    SET: 'kpl.',
  },
  // art. 106e ust. 1 pkt 12 ustawy o VAT: a reverse-charged line carries no
  // Polish VAT rate; "np." (nie podlega) is the standard FA(3) notation.
  reverseChargeLineMarker: 'np.',
  vatBasePrefix: 'Wartość netto:',
  vatRatePrefix: (percent) => `VAT (${percent}%):`,
  subtotalLabel: 'Suma częściowa:',
  discountRowLabel: (percent, customLabel) =>
    `Rabat${percent !== null ? ` (${percent}%)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Razem:',
  netValueLabel: 'Wartość razem:',
  dueLabel: 'Do zapłaty:',
  creditDueLabel: 'Do zwrotu:',
  paidLabel: 'Zapłacono:',
  exemptionPrefix: 'Podstawa zwolnienia: ',
  operationNaturePrefix: 'Rodzaj czynności: ',
  operationNatureLabels: {
    goods: 'Dostawa towarów',
    services: 'Świadczenie usług',
    mixed: 'Dostawa towarów i świadczenie usług',
  },
  deliveryAddressPrefix: 'Adres dostawy: ',
  // ustawa o VAT art. 106e ust. 11: kwota VAT w PLN, kurs, jego data i numer tabeli NBP.
  vatAmountLocalLine: ({ currencyLabel, amount, sourceLabel, rate, date, table }) =>
    `Kwota VAT w ${currencyLabel}: ${amount} (kurs ${sourceLabel} ${rate} z dnia ${date}${table ? `, tabela nr ${table}` : ''})`,
  proformaNotice: 'Faktura pro forma nie jest fakturą VAT.',
  reverseChargeNote: 'Odwrotne obciążenie – art. 196 dyrektywy 2006/112/WE',
  originalMarker: '',
  draftLabel: 'Wersja robocza',
  numberSign: 'nr',
  draftTitle: (l) => `${l} – wersja robocza`,
  correctsInvoice: (number, date) => `Dotyczy faktury nr ${number} z dnia ${date}`,
  correctionReasonPrefix: 'Przyczyna korekty: ',
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
  vatBaseWithRatePrefix: (percent) => `Wartość netto (${percent}%):`,
  buyerReferencePrefix: 'Numer referencyjny: ',
  paymentTermsPrefix: 'Termin płatności: ',
  correctionKsefNumberPrefix: 'Nr KSeF faktury korygowanej: ',
  paymentTermsDaysText: (days) => (days === 0 ? 'przy odbiorze' : `${days} dni`),
  companyRegisterLabel: 'Wpis do rejestru',
};
