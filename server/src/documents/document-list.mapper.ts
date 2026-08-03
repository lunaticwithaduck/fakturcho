import type { CurrencyCode, DocumentListItemDto } from '@fakturcho/shared-types';
import type { Client as PrismaClientRecord, Document as PrismaDocument } from '@prisma/client';
import { fromPrismaDocumentType } from '../numbering/document-type.mapper';
import { toDisplayStatus } from './document-status.mapper';

type DocumentListRow = PrismaDocument & { client: PrismaClientRecord | null };

export function toDocumentListItemDto(
  document: DocumentListRow,
  today: Date = new Date(),
): DocumentListItemDto {
  return {
    id: document.id,
    documentType: fromPrismaDocumentType(document.documentType),
    status: toDisplayStatus(document.status, document.dueAt, today),
    number: document.number !== null ? Number(document.number) : null,
    numberPrefix: document.numberPrefix,
    numberSuffix: document.numberSuffix,
    recipientCompanyName: document.recipientCompanyName ?? document.client?.companyName ?? null,
    issuedAt: document.issuedAt ? document.issuedAt.toISOString().slice(0, 10) : null,
    dueAt: document.dueAt ? document.dueAt.toISOString().slice(0, 10) : null,
    amount: document.amount,
    currency: document.currency as CurrencyCode,
    createdAt: document.createdAt.toISOString(),
  };
}
