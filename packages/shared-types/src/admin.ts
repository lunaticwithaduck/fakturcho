import type { DocumentStatus, DocumentType, SubscriptionStatus, UserRole } from './enums';
import type { Cents, CurrencyCode } from './money';

export type AccountSubscriptionStatus = SubscriptionStatus | 'none';

export interface AccountSummary {
  id: string;
  companyName: string;
  eik: string;
  city: string;
  vatRegistered: boolean;
  documentsIssued: number;
  subscriptionStatus: AccountSubscriptionStatus;
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
  creditBalanceCents: Cents;
}

export type SubscriptionStatusFilter = AccountSubscriptionStatus | 'all';

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

export interface AdminMeDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface CreditSalesSummary {
  soldAllTimeCents: Cents;
  soldThisMonthCents: Cents;
  purchasesAllTime: number;
  purchasesThisMonth: number;
}

export interface CreditSalesMonth {
  month: string;
  soldCents: Cents;
  purchases: number;
}

export interface CreditPurchaseRow {
  id: string;
  createdAt: string;
  accountId: string;
  accountName: string;
  amountCents: Cents;
  revolutOrderId: string | null;
}

export interface TrafficSeriesPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface TrafficReferrerRow {
  referrer: string;
  visitors: number;
  pageviews: number;
}

export interface TrafficPageRow {
  path: string;
  pageviews: number;
  uniqueVisitors: number;
}

export interface TrafficDeviceRow {
  device: string;
  visitors: number;
}

export interface TrafficOverview {
  connected: boolean;
  visitors: number;
  uniqueVisitors: number;
  pageviews: number;
  sessions: number;
  bounceRatePct: number;
  avgDurationSec: number;
  series: TrafficSeriesPoint[];
  referrers: TrafficReferrerRow[];
  pages: TrafficPageRow[];
  devices: TrafficDeviceRow[];
  dashboardUrl: string | null;
}

export interface GetTrafficQuery {
  from?: string | undefined;
  to?: string | undefined;
}
