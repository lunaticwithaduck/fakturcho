import type { DocumentLanguage, Locale } from './countries';

export const DOCUMENT_TYPES = [
  'invoice',
  'proforma',
  'credit_note',
  'debit_note',
  'quote',
  'delivery_note',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Фактура',
  proforma: 'Проформа фактура',
  credit_note: 'Кредитно известие',
  debit_note: 'Дебитно известие',
  quote: 'Ценова оферта',
  delivery_note: 'Стокова разписка',
};

export const DOCUMENT_TYPE_LABELS_EN: Record<DocumentType, string> = {
  invoice: 'Invoice',
  proforma: 'Proforma invoice',
  credit_note: 'Credit note',
  debit_note: 'Debit note',
  quote: 'Quote',
  delivery_note: 'Delivery note',
};

export const DOCUMENT_TYPE_LABELS_DE: Record<DocumentType, string> = {
  invoice: 'Rechnung',
  proforma: 'Proforma-Rechnung',
  credit_note: 'Rechnungskorrektur',
  debit_note: 'Belastungsanzeige',
  quote: 'Angebot',
  delivery_note: 'Lieferschein',
};

export const DOCUMENT_TYPE_LABELS_FR: Record<DocumentType, string> = {
  invoice: 'Facture',
  proforma: 'Facture pro forma',
  credit_note: 'Avoir',
  debit_note: 'Note de débit',
  quote: 'Devis',
  delivery_note: 'Bon de livraison',
};

export const DOCUMENT_TYPE_LABELS_IT: Record<DocumentType, string> = {
  invoice: 'Fattura',
  proforma: 'Fattura proforma',
  credit_note: 'Nota di credito',
  debit_note: 'Nota di debito',
  quote: 'Preventivo',
  delivery_note: 'Documento di trasporto (DDT)',
};

export const DOCUMENT_TYPE_LABELS_PL: Record<DocumentType, string> = {
  invoice: 'Faktura',
  proforma: 'Faktura pro forma',
  credit_note: 'Faktura korygująca',
  debit_note: 'Nota debetowa',
  quote: 'Oferta',
  delivery_note: 'Dowód dostawy',
};

export const DOCUMENT_TYPE_LABELS_RO: Record<DocumentType, string> = {
  invoice: 'Factură',
  proforma: 'Factură proformă',
  credit_note: 'Notă de credit',
  debit_note: 'Notă de debit',
  quote: 'Ofertă',
  delivery_note: 'Aviz de însoțire a mărfii',
};

export const DOCUMENT_TYPE_LABELS_ES: Record<DocumentType, string> = {
  invoice: 'Factura',
  proforma: 'Factura proforma',
  credit_note: 'Factura rectificativa (abono)',
  debit_note: 'Factura rectificativa (cargo)',
  quote: 'Presupuesto',
  delivery_note: 'Albarán',
};

const DOCUMENT_TYPE_LABELS_BY_LANGUAGE: Record<DocumentLanguage, Record<DocumentType, string>> = {
  bg: DOCUMENT_TYPE_LABELS,
  en: DOCUMENT_TYPE_LABELS_EN,
  de: DOCUMENT_TYPE_LABELS_DE,
  fr: DOCUMENT_TYPE_LABELS_FR,
  it: DOCUMENT_TYPE_LABELS_IT,
  pl: DOCUMENT_TYPE_LABELS_PL,
  ro: DOCUMENT_TYPE_LABELS_RO,
  es: DOCUMENT_TYPE_LABELS_ES,
};

// Kept in lockstep with server/src/render/templates/classic/labels/<lang>.ts
// documentType — same names appear on the PDF.
export function getDocumentTypeLabel(type: DocumentType, language: DocumentLanguage): string {
  return DOCUMENT_TYPE_LABELS_BY_LANGUAGE[language][type];
}

export const TAX_DOCUMENT_TYPES: Record<DocumentType, boolean> = {
  invoice: true,
  proforma: false,
  credit_note: true,
  debit_note: true,
  quote: false,
  delivery_note: false,
};

export const CORRECTION_DOCUMENT_TYPES: readonly DocumentType[] = ['credit_note', 'debit_note'];

export const STORED_DOCUMENT_STATUSES = ['draft', 'sent', 'paid', 'cancelled'] as const;
export type StoredDocumentStatus = (typeof STORED_DOCUMENT_STATUSES)[number];

export const DOCUMENT_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Чернова',
  sent: 'Издадена',
  paid: 'ПЛАТЕНО',
  overdue: 'ПРОСРОЧЕНА',
  cancelled: 'АНУЛИРАНА',
};

export const DOCUMENT_STATUS_LABELS_EN: Record<DocumentStatus, string> = {
  draft: 'Draft',
  sent: 'Issued',
  paid: 'PAID',
  overdue: 'OVERDUE',
  cancelled: 'CANCELLED',
};

export const DOCUMENT_STATUS_LABELS_DE: Record<DocumentStatus, string> = {
  draft: 'Entwurf',
  sent: 'Ausgestellt',
  paid: 'BEZAHLT',
  overdue: 'ÜBERFÄLLIG',
  cancelled: 'STORNIERT',
};

export const DOCUMENT_STATUS_LABELS_FR: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  sent: 'Émise',
  paid: 'PAYÉE',
  overdue: 'EN RETARD',
  cancelled: 'ANNULÉE',
};

export const DOCUMENT_STATUS_LABELS_IT: Record<DocumentStatus, string> = {
  draft: 'Bozza',
  sent: 'Emessa',
  paid: 'PAGATA',
  overdue: 'SCADUTA',
  cancelled: 'ANNULLATA',
};

export const DOCUMENT_STATUS_LABELS_PL: Record<DocumentStatus, string> = {
  draft: 'Wersja robocza',
  sent: 'Wystawiona',
  paid: 'ZAPŁACONO',
  overdue: 'ZALEGŁA',
  cancelled: 'ANULOWANA',
};

export const DOCUMENT_STATUS_LABELS_RO: Record<DocumentStatus, string> = {
  draft: 'Ciornă',
  sent: 'Emisă',
  paid: 'PLĂTITĂ',
  overdue: 'RESTANTĂ',
  cancelled: 'ANULATĂ',
};

export const DOCUMENT_STATUS_LABELS_ES: Record<DocumentStatus, string> = {
  draft: 'Borrador',
  sent: 'Emitida',
  paid: 'PAGADA',
  overdue: 'VENCIDA',
  cancelled: 'ANULADA',
};

const DOCUMENT_STATUS_LABELS_BY_LOCALE: Record<Locale, Record<DocumentStatus, string>> = {
  bg: DOCUMENT_STATUS_LABELS,
  en: DOCUMENT_STATUS_LABELS_EN,
  de: DOCUMENT_STATUS_LABELS_DE,
  fr: DOCUMENT_STATUS_LABELS_FR,
  it: DOCUMENT_STATUS_LABELS_IT,
  pl: DOCUMENT_STATUS_LABELS_PL,
  ro: DOCUMENT_STATUS_LABELS_RO,
  es: DOCUMENT_STATUS_LABELS_ES,
};

// paid/overdue/cancelled agree with the feminine document nouns (Rechnung,
// facture, fattura, faktura, factură, factura are all feminine) except
// German, whose predicate adjectives don't inflect for gender.
export function getDocumentStatusLabel(status: DocumentStatus, locale: Locale): string {
  return DOCUMENT_STATUS_LABELS_BY_LOCALE[locale][status];
}

export const SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due', 'canceled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
