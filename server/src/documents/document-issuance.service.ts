import type { DocumentDto, IssueDocumentRequest } from '@fakturcho/shared-types';
import { isIssuerProfileComplete } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { fromPrismaDocumentType } from '../numbering/document-type.mapper';
import { NumberingService } from '../numbering/numbering.service';
import { parseDateOnly, startOfTodayUtc } from './date.util';
import { toDocumentDto } from './document.mapper';
import { DOCUMENT_INCLUDE } from './document-include';
import { toIssuerProfileDto } from './issuer-profile.mapper';

@Injectable()
export class DocumentIssuanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberingService: NumberingService,
  ) {}

  async issue(
    accountId: string,
    documentId: string,
    request: IssueDocumentRequest,
  ): Promise<DocumentDto> {
    const existing = await this.prisma.document.findFirst({ where: { id: documentId, accountId } });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Document not found.');
    }
    if (existing.status !== PrismaDocumentStatus.DRAFT) {
      throw new DomainError('DOCUMENT_IMMUTABLE', 'Only draft documents can be issued.');
    }

    const issuerProfile = await this.prisma.issuerProfile.findUnique({ where: { accountId } });
    if (!isIssuerProfileComplete(toIssuerProfileDto(issuerProfile))) {
      throw new DomainError(
        'ISSUER_PROFILE_INCOMPLETE',
        'The issuer profile must be complete before issuing documents.',
      );
    }

    const client = existing.clientId
      ? await this.prisma.client.findFirst({ where: { id: existing.clientId, accountId } })
      : null;

    const issuedAt = parseDateOnly(request.issuedAt) ?? startOfTodayUtc();
    const documentType = fromPrismaDocumentType(existing.documentType);

    const record = await this.prisma.$transaction(
      async (tx) => {
        const number = await this.numberingService.claimNumber(
          tx,
          accountId,
          documentType,
          request.overrideNumber,
        );
        return tx.document.update({
          where: { id: documentId },
          data: {
            number,
            status: PrismaDocumentStatus.SENT,
            issuedAt,
            issuerCompanyName: issuerProfile?.companyName ?? null,
            issuerEik: issuerProfile?.eik ?? null,
            issuerMol: issuerProfile?.mol ?? null,
            issuerAddressLine: issuerProfile?.addressLine ?? null,
            issuerCity: issuerProfile?.city ?? null,
            issuerPhone: issuerProfile?.phone ?? null,
            issuerVatRegistered: issuerProfile?.vatRegistered ?? false,
            issuerVatNumber: issuerProfile?.vatNumber ?? null,
            issuerBankName: issuerProfile?.bankName ?? null,
            issuerIban: issuerProfile?.iban ?? null,
            issuerBic: issuerProfile?.bic ?? null,
            issuerAltIban: issuerProfile?.altIban ?? null,
            recipientCompanyName: client?.companyName ?? null,
            recipientEik: client?.eik ?? null,
            recipientVatNumber: client?.vatNumber ?? null,
            recipientAddress: client?.address ?? null,
            recipientEmail: client?.email ?? null,
            recipientMol: client?.mol ?? null,
          },
          include: DOCUMENT_INCLUDE,
        });
      },
      { timeout: 20_000, maxWait: 20_000 },
    );

    return toDocumentDto(record);
  }

  async cancel(accountId: string, documentId: string): Promise<DocumentDto> {
    const existing = await this.prisma.document.findFirst({ where: { id: documentId, accountId } });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Document not found.');
    }
    if (
      existing.status !== PrismaDocumentStatus.SENT &&
      existing.status !== PrismaDocumentStatus.PAID
    ) {
      throw new DomainError('DOCUMENT_IMMUTABLE', 'Only sent or paid documents can be cancelled.');
    }
    const record = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: PrismaDocumentStatus.CANCELLED },
      include: DOCUMENT_INCLUDE,
    });
    return toDocumentDto(record);
  }

  async markPaid(accountId: string, documentId: string): Promise<DocumentDto> {
    const existing = await this.prisma.document.findFirst({ where: { id: documentId, accountId } });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Document not found.');
    }
    if (existing.status !== PrismaDocumentStatus.SENT) {
      throw new DomainError('DOCUMENT_IMMUTABLE', 'Only sent documents can be marked as paid.');
    }
    const record = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: PrismaDocumentStatus.PAID },
      include: DOCUMENT_INCLUDE,
    });
    return toDocumentDto(record);
  }
}
