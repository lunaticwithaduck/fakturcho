import type {
  DocumentDto,
  DocumentListItemDto,
  DocumentListQuery,
  SaveDraftRequest,
} from '@fakturcho/shared-types';
import { CORRECTION_DOCUMENT_TYPES, getCountryConfig } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { computeLineTotal } from '../money/totals';
import { hasValidVatNumberFormat, resolveLineVatCategory } from '../vat-eu/reverse-charge';
import { toDocumentDto } from './document.mapper';
import { DOCUMENT_INCLUDE } from './document-include';
import { toDocumentListItemDto } from './document-list.mapper';
import { buildDocumentListWhere } from './document-list-query';
import { buildDraftData } from './draft-data.builder';
import { applyLineVatGroups, resolveVatTreatment } from './vat-treatment';

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
    const client = request.clientId
      ? await this.prisma.client.findFirst({ where: { id: request.clientId, accountId } })
      : null;

    const issuerCountry = issuerProfile?.country ?? 'BG';
    const issuerVatRegistered = issuerProfile?.vatRegistered ?? false;
    const clientHasValidVatNumber = client
      ? hasValidVatNumberFormat(client.vatNumber, client.country)
      : false;

    const vat = resolveVatTreatment({
      documentType: request.documentType,
      vatRegistered: issuerVatRegistered,
      requestedGround: request.vatExemptionGround ?? null,
      issuerCountry,
    });

    const resolvedLineItems = request.lineItems.map((line) => {
      const vatCategory =
        line.vatCategory !== undefined
          ? line.vatCategory
          : !vat.vatCharged
            ? 'O'
            : resolveLineVatCategory(
                issuerCountry,
                client?.country ?? null,
                undefined,
                clientHasValidVatNumber,
                issuerVatRegistered,
              );
      const vatRateBp =
        line.vatRateBp !== undefined
          ? line.vatRateBp
          : vatCategory === 'AE' || vatCategory === 'O'
            ? 0
            : getCountryConfig(issuerCountry).defaultVatRateBp;

      return { ...line, vatCategory, vatRateBp };
    });

    const documentVat = applyLineVatGroups(vat, resolvedLineItems);

    const data = {
      ...buildDraftData(accountId, request, documentVat, resolvedLineItems),
      documentLanguage:
        request.documentLanguage !== undefined
          ? request.documentLanguage
          : (client?.documentLanguage ?? null),
    };

    const record = await this.prisma.$transaction(async (tx) => {
      const document = existingId
        ? await tx.document.update({ where: { id: existingId }, data })
        : await tx.document.create({ data });

      await tx.lineItem.deleteMany({ where: { documentId: document.id } });
      await tx.discount.deleteMany({ where: { documentId: document.id } });

      if (resolvedLineItems.length > 0) {
        await tx.lineItem.createMany({
          data: resolvedLineItems.map((line, index) => ({
            documentId: document.id,
            name: line.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: computeLineTotal(line.quantity, line.unitPrice),
            sortOrder: line.sortOrder ?? index,
            vatRateBp: line.vatRateBp,
            vatCategory: line.vatCategory,
            unitCode: line.unitCode ?? null,
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
