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
