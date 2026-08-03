import type { DocumentType } from '@fakturcho/shared-types';
import { DocumentType as PrismaDocumentType } from '@prisma/client';

const TO_PRISMA: Record<DocumentType, PrismaDocumentType> = {
  invoice: PrismaDocumentType.INVOICE,
  proforma: PrismaDocumentType.PROFORMA,
  credit_note: PrismaDocumentType.CREDIT_NOTE,
  debit_note: PrismaDocumentType.DEBIT_NOTE,
  quote: PrismaDocumentType.QUOTE,
};

const FROM_PRISMA: Record<PrismaDocumentType, DocumentType> = {
  INVOICE: 'invoice',
  PROFORMA: 'proforma',
  CREDIT_NOTE: 'credit_note',
  DEBIT_NOTE: 'debit_note',
  QUOTE: 'quote',
};

export function toPrismaDocumentType(value: DocumentType): PrismaDocumentType {
  return TO_PRISMA[value];
}

export function fromPrismaDocumentType(value: PrismaDocumentType): DocumentType {
  return FROM_PRISMA[value];
}
