import type { Locale } from './countries';

export const DOCUMENT_TYPES = [
  'invoice',
  'proforma',
  'credit_note',
  'debit_note',
  'quote',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Фактура',
  proforma: 'Проформа фактура',
  credit_note: 'Кредитно известие',
  debit_note: 'Дебитно известие',
  quote: 'Ценова оферта',
};

export const DOCUMENT_TYPE_LABELS_EN: Record<DocumentType, string> = {
  invoice: 'Invoice',
  proforma: 'Proforma invoice',
  credit_note: 'Credit note',
  debit_note: 'Debit note',
  quote: 'Quote',
};

export function getDocumentTypeLabel(type: DocumentType, locale: Locale): string {
  return locale === 'en' ? DOCUMENT_TYPE_LABELS_EN[type] : DOCUMENT_TYPE_LABELS[type];
}

export const TAX_DOCUMENT_TYPES: Record<DocumentType, boolean> = {
  invoice: true,
  proforma: false,
  credit_note: true,
  debit_note: true,
  quote: false,
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

export function getDocumentStatusLabel(status: DocumentStatus, locale: Locale): string {
  return locale === 'en' ? DOCUMENT_STATUS_LABELS_EN[status] : DOCUMENT_STATUS_LABELS[status];
}

export const SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due', 'canceled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
