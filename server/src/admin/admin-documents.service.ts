import type { AdminDocumentSummary, DocumentListFilters } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { type Prisma, DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { toPrismaStatus } from '../documents/document-status.mapper';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { toPrismaDocumentType } from '../numbering/document-type.mapper';
import { toAdminDocumentSummary } from './admin-documents.mapper';

const DOCUMENT_LIST_TAKE = 500;

const DOCUMENT_INCLUDE = {
  account: {
    include: {
      issuerProfile: true,
      users: { orderBy: { createdAt: 'asc' as const }, take: 1, select: { email: true } },
    },
  },
} satisfies Prisma.DocumentInclude;

function buildAdminDocumentWhere(filters: DocumentListFilters): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {};

  if (filters.documentType !== 'all') {
    where.documentType = toPrismaDocumentType(filters.documentType);
  }

  if (filters.status === 'overdue') {
    where.status = PrismaDocumentStatus.SENT;
    where.dueAt = { lt: new Date() };
  } else if (filters.status !== 'all') {
    where.status = toPrismaStatus(filters.status);
  }

  if (filters.search.trim()) {
    const search = filters.search.trim();
    where.OR = [
      { recipientCompanyName: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { account: { issuerProfile: { companyName: { contains: search, mode: 'insensitive' } } } },
      { account: { users: { some: { email: { contains: search, mode: 'insensitive' } } } } },
    ];
  }

  return where;
}

@Injectable()
export class AdminDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: DocumentListFilters): Promise<AdminDocumentSummary[]> {
    const rows = await this.prisma.document.findMany({
      where: buildAdminDocumentWhere(filters),
      include: DOCUMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: DOCUMENT_LIST_TAKE,
    });
    return rows.map((row) => toAdminDocumentSummary(row));
  }
}
