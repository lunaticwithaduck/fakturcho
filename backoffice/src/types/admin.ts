import type {
  Cents,
  CurrencyCode,
  DocumentStatus,
  DocumentType,
  SubscriptionStatus,
} from '@fakturcho/shared-types';

export interface AccountSummary {
  id: string;
  companyName: string;
  eik: string;
  city: string;
  vatRegistered: boolean;
  documentsIssued: number;
  subscriptionStatus: SubscriptionStatus;
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
  planName: string;
  mrrCents: Cents;
  currentPeriodEnd: string | null;
}

export type SubscriptionStatusFilter = SubscriptionStatus | 'all';

export interface AccountListFilters {
  search: string;
  status: SubscriptionStatusFilter;
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

export interface SubscriptionSummary {
  id: string;
  accountId: string;
  accountName: string;
  status: SubscriptionStatus;
  planName: string;
  mrrCents: Cents;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface MrrSummary {
  mrrCents: Cents;
  activeCount: number;
  trialingCount: number;
  pastDueCount: number;
  canceledCount: number;
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
