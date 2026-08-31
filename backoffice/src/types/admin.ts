import type { Cents, CurrencyCode, DocumentStatus, DocumentType } from '@fakturcho/shared-types';

export interface AccountSummary {
  id: string;
  companyName: string;
  eik: string;
  city: string;
  vatRegistered: boolean;
  documentsIssued: number;
  createdAt: string;
}

export interface AccountDetail extends AccountSummary {
  addressLine: string;
  vatNumber: string | null;
  mol: string;
  phone: string;
  email: string;
  iban: string;
  bic: string;
}

export interface AccountListFilters {
  search: string;
}

export interface AdminDocumentSummary {
  id: string;
  accountId: string;
  accountName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  number: string;
  recipientCompanyName: string;
  amount: Cents;
  currency: CurrencyCode;
  issuedAt: string | null;
}

export type DocumentTypeFilter = DocumentType | 'all';
export type DocumentStatusFilter = DocumentStatus | 'all';

export interface DocumentListFilters {
  search: string;
  documentType: DocumentTypeFilter;
  status: DocumentStatusFilter;
}

export interface UsageMonthSummary {
  month: string;
  documentsIssued: number;
  activeAccounts: number;
  emailsSent: number;
}

export interface TurnoverReportRow {
  accountId: string;
  accountName: string;
  documentsIssued: number;
  turnoverCents: Cents;
}
