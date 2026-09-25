import type {
  DocumentLanguage,
  DocumentType,
  OperationNature,
  UnitCode,
} from '@fakturcho/shared-types';
import { bg } from './bg';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { pl } from './pl';
import { ro } from './ro';

export type ClassicLanguage = DocumentLanguage;

export interface VatAmountLocalLineParams {
  currencyLabel: string;
  amount: string;
  sourceLabel: string;
  rate: string;
  date: string;
  table: string | null;
}

export interface ClassicLabels {
  companyIdLabel: string;
  supplierTitle: string;
  recipientTitle: (documentType: DocumentType) => string;
  vatNumberPrefix: string;
  molPrefix: string;
  issuedAtPrefix: (documentType: DocumentType) => string;
  taxEventPrefix: string;
  // Functions of the document type: several languages inflect these for the
  // grammatical gender of the document noun (e.g. IT "il preventivo" is
  // masculine, everything else in that language is feminine).
  validUntilPrefix: (documentType: DocumentType) => string;
  deliveryDatePrefix: string;
  transportReasonPrefix: string;
  transportedAtPrefix: string;
  carrierNamePrefix: string;
  transportNotePrefix: string;
  statusPaid: (documentType: DocumentType) => string;
  statusCancelled: (documentType: DocumentType) => string;
  phonePrefix: string;
  bicPrefix: string;
  preparedByPrefix: (documentType: DocumentType) => string;
  recipientSignaturePrefix: (documentType: DocumentType) => string;
  colName: string;
  colQuantity: string;
  colUnit: string;
  colVatRate: string;
  colPrice: string;
  colTotal: string;
  // Short printed abbreviation per UN/ECE Rec 20 unit code (VAT Directive art.
  // 226(6); PL art. 106e ust. 1 pkt 8 "miara"; BG ЗДДС чл. 114 ал. 1 т. 8).
  unitLabels: Record<UnitCode, string>;
  // Printed in the per-line VAT rate column for a reverse-charged (AE) line.
  reverseChargeLineMarker: string;
  vatBasePrefix: string;
  vatRatePrefix: (percent: number) => string;
  subtotalLabel: string;
  discountRowLabel: (percent: number | null, customLabel: string | null) => string;
  totalLabel: string;
  totalWithVatLabel?: string;
  netValueLabel: string;
  dueLabel: string;
  creditDueLabel: string;
  paidLabel: string;
  exemptionPrefix: string;
  zeroRatePrefix?: string;
  // CGI art. 242 nonies A (French e-invoicing reform): printed only for a
  // French issuer's tax documents, in the chosen document language.
  operationNaturePrefix: string;
  operationNatureLabels: Record<OperationNature, string>;
  deliveryAddressPrefix: string;
  // VAT Directive art. 230: the VAT amount in the issuer's national currency,
  // shown only when Document.vatAmountLocal was snapshotted at issuance.
  vatAmountLocalLine: (params: VatAmountLocalLineParams) => string;
  proformaNotice: string;
  reverseChargeNote: string;
  originalMarker: string;
  draftLabel: string;
  numberSign: string;
  draftTitle: (documentLabel: string) => string;
  correctsInvoice: (number: string, date: string) => string;
  correctionReasonPrefix: string;
  documentType: Record<DocumentType, string>;
  watermarkMain: string;
  watermarkSub: string;
}

export const CLASSIC_LABELS: Record<ClassicLanguage, ClassicLabels> = {
  bg,
  en,
  de,
  fr,
  it,
  pl,
  ro,
  es,
};

export function getClassicLabels(language: ClassicLanguage): ClassicLabels {
  return CLASSIC_LABELS[language];
}
