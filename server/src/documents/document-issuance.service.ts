import type { DocumentDto, IssueDocumentRequest } from '@fakturcho/shared-types';
import { isIssuerProfileComplete, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { CreditsService } from '../billing/credits.service';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { fromPrismaDocumentType } from '../numbering/document-type.mapper';
import { NumberingService } from '../numbering/numbering.service';
import { ExchangeRateService } from '../vat-eu/exchange-rate.service';
import { addDaysUtc, parseDateOnly, startOfTodayUtc } from './date.util';
import { toDocumentDto } from './document.mapper';
import { DOCUMENT_INCLUDE } from './document-include';
import { assertIssuable, issuedNumberPrefix } from './document-issuance.rules';
import { resolveIssuanceLocalCurrencyVat } from './document-issuance-local-currency';
import {
  issuerSnapshotUpdateFields,
  recipientSnapshotUpdateFields,
} from './issuance-snapshot-fields';
import { toIssuerProfileDto } from './issuer-profile.mapper';

@Injectable()
export class DocumentIssuanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberingService: NumberingService,
    private readonly creditsService: CreditsService,
    private readonly exchangeRateService: ExchangeRateService = new ExchangeRateService(),
  ) {}

  async issue(
    accountId: string,
    documentId: string,
    request: IssueDocumentRequest,
  ): Promise<DocumentDto> {
    const existing = await this.prisma.document.findFirst({
      where: { id: documentId, accountId },
      include: { lineItems: true },
    });
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
    // BG ЗДДС чл. 114, ал. 1, т. 10 (and every other transposition of VAT
    // Directive art. 226(7)) requires the tax-point date on a tax document; a
    // blank one defaults to the issue date, so the PDF and every XML mapper
    // agree instead of each falling back independently.
    const taxEventAt = TAX_DOCUMENT_TYPES[documentType]
      ? (existing.taxEventAt ?? issuedAt)
      : existing.taxEventAt;
    // Composer's structured payment-terms selector: dueAt is always the
    // actual issue date plus the chosen day count, not whatever was on the
    // draft when it was saved (issuance can happen long after).
    const dueAt =
      existing.paymentTermsDays != null
        ? addDaysUtc(issuedAt, existing.paymentTermsDays)
        : existing.dueAt;

    const country = issuerProfile?.country ?? null;
    assertIssuable(existing, documentType, country);
    const numberPrefix = issuedNumberPrefix(existing, documentType, country);

    const isCorrection = documentType === 'credit_note' || documentType === 'debit_note';
    const originalDocument =
      isCorrection && existing.originalDocumentId
        ? await this.prisma.document.findFirst({
            where: { id: existing.originalDocumentId, accountId },
          })
        : null;

    const localCurrencyVat = await resolveIssuanceLocalCurrencyVat(
      {
        documentType,
        issuerCountry: issuerProfile?.country ?? null,
        currency: existing.currency,
        vatAmount: existing.vatAmount,
        taxEventAt,
        issuedAt,
        subtotal: existing.subtotal,
        discountTotal: existing.discountTotal,
        lineItems: existing.lineItems,
        isCorrection,
        originalDocument,
      },
      this.exchangeRateService,
    );

    const record = await this.prisma.$transaction(
      async (tx) => {
        // SPEC §11 invariant 20: the charge precedes the claim, so a rejected charge never claims a number
        await this.creditsService.chargeForIssuance(tx, accountId, documentId);
        const number = await this.numberingService.claimNumber(
          tx,
          accountId,
          documentType,
          country,
          request.overrideNumber,
        );
        return tx.document.update({
          where: { id: documentId },
          data: {
            number,
            numberPrefix,
            status: PrismaDocumentStatus.SENT,
            issuedAt,
            taxEventAt,
            dueAt,
            localCurrency: localCurrencyVat?.localCurrency ?? null,
            exchangeRate: localCurrencyVat?.exchangeRate ?? null,
            exchangeRateDate: localCurrencyVat?.exchangeRateDate ?? null,
            exchangeRateSource: localCurrencyVat?.exchangeRateSource ?? null,
            exchangeRateTable: localCurrencyVat?.exchangeRateTable ?? null,
            vatAmountLocal: localCurrencyVat?.vatAmountLocal ?? null,
            ...(localCurrencyVat?.vatAmountLocalByRate
              ? {
                  vatAmountLocalByRate:
                    localCurrencyVat.vatAmountLocalByRate as unknown as Prisma.InputJsonValue,
                }
              : {}),
            ...issuerSnapshotUpdateFields(issuerProfile),
            ...(issuerProfile?.identifiers ? { issuerIdentifiers: issuerProfile.identifiers } : {}),
            ...recipientSnapshotUpdateFields(client),
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
