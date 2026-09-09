import type { Locale } from './countries';
import type { DocumentStatus, DocumentType } from './enums';
import type { Cents, CurrencyCode } from './money';
import type { VatCategory } from './vat';

export interface LineItemDto {
  id: string;
  name: string;
  quantity: string;
  unitPrice: Cents;
  lineTotal: Cents;
  sortOrder: number;
  vatRateBp: number;
  vatCategory: VatCategory;
  unitCode: string | null;
}

export interface DiscountDto {
  id: string;
  label: string;
  percentBp: number | null;
  amount: Cents | null;
  sortOrder: number;
}

export interface IssuerSnapshotDto {
  companyName: string | null;
  eik: string | null;
  mol: string | null;
  addressLine: string | null;
  street: string | null;
  postcode: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  vatRegistered: boolean | null;
  vatNumber: string | null;
  bankName: string | null;
  iban: string | null;
  bic: string | null;
  altIban: string | null;
}

export interface RecipientSnapshotDto {
  companyName: string | null;
  eik: string | null;
  vatNumber: string | null;
  address: string | null;
  street: string | null;
  postcode: string | null;
  country: string | null;
  email: string | null;
  mol: string | null;
}

export interface DocumentDto {
  id: string;
  documentType: DocumentType;
  status: DocumentStatus;
  number: number | null;
  numberPrefix: string | null;
  numberSuffix: string | null;
  referenceNumber: string | null;
  originalDocumentId: string | null;
  issuedAt: string | null;
  taxEventAt: string | null;
  dueAt: string | null;
  validUntil: string | null;
  deliveryDate: string | null;
  buyerReference: string | null;
  paymentMeansCode: string | null;
  paymentTermsNote: string | null;
  subtotal: Cents;
  discountTotal: Cents;
  amount: Cents;
  vatIncluded: boolean;
  vatRateBp: number;
  vatAmount: Cents;
  vatExemptionGround: string | null;
  currency: CurrencyCode;
  clientId: string | null;
  preparedBy: string | null;
  notes: string | null;
  emailText: string | null;
  emailedAt: string | null;
  templateId: string;
  documentLanguage: Locale | null;
  issuer: IssuerSnapshotDto;
  recipient: RecipientSnapshotDto;
  lineItems: LineItemDto[];
  discounts: DiscountDto[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListItemDto {
  id: string;
  documentType: DocumentType;
  status: DocumentStatus;
  number: number | null;
  numberPrefix: string | null;
  numberSuffix: string | null;
  recipientCompanyName: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  amount: Cents;
  currency: CurrencyCode;
  createdAt: string;
}

export interface LineItemInput {
  name: string;
  quantity: string;
  unitPrice: Cents;
  sortOrder: number;
  vatRateBp?: number;
  vatCategory?: VatCategory;
  unitCode?: string | null;
}

export interface DiscountInput {
  label: string;
  percentBp?: number | null;
  amount?: Cents | null;
  sortOrder?: number;
}

export interface SaveDraftRequest {
  documentType: DocumentType;
  referenceNumber?: string | null;
  originalDocumentId?: string | null;
  taxEventAt?: string | null;
  dueAt?: string | null;
  validUntil?: string | null;
  deliveryDate?: string | null;
  buyerReference?: string | null;
  paymentMeansCode?: string | null;
  paymentTermsNote?: string | null;
  vatIncluded?: boolean;
  vatExemptionGround?: string | null;
  clientId?: string | null;
  preparedBy?: string | null;
  notes?: string | null;
  emailText?: string | null;
  templateId?: string;
  documentLanguage?: Locale | null;
  lineItems: LineItemInput[];
  discounts?: DiscountInput[];
}

export interface IssueDocumentRequest {
  issuedAt?: string;
  overrideNumber?: number;
}

export interface DocumentListQuery {
  documentType?: DocumentType;
  status?: DocumentStatus;
  clientId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SeriesInfoDto {
  documentType: DocumentType;
  previousNumber: number | null;
  nextNumber: number;
  overridable: boolean;
}

export interface EmailDocumentRequest {
  to: string;
  emailText: string;
}

export const DOCUMENT_NUMBER_DIGITS = 10;

export function formatDocumentNumber(value: number): string {
  return String(value).padStart(DOCUMENT_NUMBER_DIGITS, '0');
}
