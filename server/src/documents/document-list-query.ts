import type { DocumentListQuery } from '@fakturcho/shared-types';
import { type Prisma, DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { toPrismaDocumentType } from '../numbering/document-type.mapper';
import { toPrismaStatus } from './document-status.mapper';

export function buildDocumentListWhere(
  accountId: string,
  query: DocumentListQuery,
): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = { accountId };

  if (query.documentType) {
    where.documentType = toPrismaDocumentType(query.documentType);
  }
  if (query.clientId) {
    where.clientId = query.clientId;
  }
  if (query.status === 'overdue') {
    where.status = PrismaDocumentStatus.SENT;
    where.dueAt = { lt: new Date() };
  } else if (query.status) {
    where.status = toPrismaStatus(query.status);
  }
  if (query.search) {
    where.OR = [
      { recipientCompanyName: { contains: query.search, mode: 'insensitive' } },
      { referenceNumber: { contains: query.search, mode: 'insensitive' } },
      { client: { companyName: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  return where;
}
