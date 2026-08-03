import type {
  DocumentDto,
  DocumentListItemDto,
  DocumentListQuery,
  SaveDraftRequest,
} from '@fakturcho/shared-types';
import { CORRECTION_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { computeLineTotal } from '../money/totals';
import { toDocumentDto } from './document.mapper';
import { DOCUMENT_INCLUDE } from './document-include';
import { toDocumentListItemDto } from './document-list.mapper';
import { buildDocumentListWhere } from './document-list-query';
import { buildDraftData } from './draft-data.builder';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveDraft(
    accountId: string,
    documentId: string | null,
    request: SaveDraftRequest,
  ): Promise<DocumentDto> {
    if (CORRECTION_DOCUMENT_TYPES.includes(request.documentType) && !request.originalDocumentId) {
      throw new DomainError(
        'ORIGINAL_DOCUMENT_REQUIRED',
        'credit_note and debit_note require originalDocumentId.',
      );
    }

    let existingId: string | null = null;
    if (documentId) {
      const existing = await this.prisma.document.findFirst({
        where: { id: documentId, accountId },
      });
      if (!existing) {
        throw new DomainError('NOT_FOUND', 'Document not found.');
      }
      if (existing.status !== PrismaDocumentStatus.DRAFT) {
        throw new DomainError('DOCUMENT_IMMUTABLE', 'Only draft documents can be edited.');
      }
      existingId = existing.id;
    }

    const issuerProfile = await this.prisma.issuerProfile.findUnique({ where: { accountId } });
    const data = buildDraftData(accountId, request, issuerProfile?.vatRegistered ?? false);

    const record = await this.prisma.$transaction(async (tx) => {
      const document = existingId
        ? await tx.document.update({ where: { id: existingId }, data })
        : await tx.document.create({ data });

      await tx.lineItem.deleteMany({ where: { documentId: document.id } });
      await tx.discount.deleteMany({ where: { documentId: document.id } });

      if (request.lineItems.length > 0) {
        await tx.lineItem.createMany({
          data: request.lineItems.map((line, index) => ({
            documentId: document.id,
            name: line.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: computeLineTotal(line.quantity, line.unitPrice),
            sortOrder: line.sortOrder ?? index,
          })),
        });
      }

      const discounts = request.discounts ?? [];
      if (discounts.length > 0) {
        await tx.discount.createMany({
          data: discounts.map((discount, index) => ({
            documentId: document.id,
            label: discount.label,
            percentBp: discount.percentBp ?? null,
            amount: discount.amount ?? null,
            sortOrder: discount.sortOrder ?? index,
          })),
        });
      }

      return tx.document.findUniqueOrThrow({
        where: { id: document.id },
        include: DOCUMENT_INCLUDE,
      });
    });

    return toDocumentDto(record);
  }

  async get(accountId: string, documentId: string): Promise<DocumentDto> {
    const record = await this.prisma.document.findFirst({
      where: { id: documentId, accountId },
      include: DOCUMENT_INCLUDE,
    });
    if (!record) {
      throw new DomainError('NOT_FOUND', 'Document not found.');
    }
    return toDocumentDto(record);
  }

  async list(
    accountId: string,
    query: DocumentListQuery,
  ): Promise<{ items: DocumentListItemDto[]; total: number }> {
    const where = buildDocumentListWhere(accountId, query);
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { items: rows.map((row) => toDocumentListItemDto(row)), total };
  }
}
