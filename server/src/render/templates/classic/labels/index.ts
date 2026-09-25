import type { DocumentLanguage, DocumentType } from '@fakturcho/shared-types';
import { bg } from './bg';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { pl } from './pl';
import { ro } from './ro';

export type ClassicLanguage = DocumentLanguage;

export interface ClassicLabels {
  companyIdLabel: string;
  recipientTitle: string;
  vatNumberPrefix: string;
  molPrefix: string;
  issuedAtPrefix: string;
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
  colPrice: string;
  colTotal: string;
  vatBasePrefix: string;
  vatRatePrefix: (percent: number) => string;
  subtotalLabel: string;
  discountRowLabel: (percent: number | null, customLabel: string | null) => string;
  totalLabel: string;
  dueLabel: string;
  exemptionPrefix: string;
  originalMarker: string;
  draftLabel: string;
  correctsInvoice: (number: string, date: string) => string;
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
