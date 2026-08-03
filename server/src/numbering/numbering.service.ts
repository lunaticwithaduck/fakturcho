import { randomUUID } from 'node:crypto';
import type { DocumentType, SeriesInfoDto } from '@fakturcho/shared-types';
import { DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { toPrismaDocumentType } from './document-type.mapper';

interface LockedSeriesRow {
  id: string;
  nextNumber: bigint;
  issuedCount: number;
}

@Injectable()
export class NumberingService {
  constructor(private readonly prisma: PrismaService) {}

  async claimNumber(
    tx: Prisma.TransactionClient,
    accountId: string,
    documentType: DocumentType,
    overrideNumber?: number,
  ): Promise<bigint> {
    if (overrideNumber !== undefined && (!Number.isInteger(overrideNumber) || overrideNumber < 1)) {
      throw new DomainError('VALIDATION_FAILED', 'overrideNumber must be a positive integer.');
    }

    const prismaType = toPrismaDocumentType(documentType);

    await tx.$executeRaw`
      INSERT INTO "number_series" ("id", "accountId", "documentType", "nextNumber", "issuedCount", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${accountId}, ${prismaType}::"DocumentType", 1, 0, now(), now())
      ON CONFLICT ("accountId", "documentType") DO NOTHING
    `;

    const rows = await tx.$queryRaw<LockedSeriesRow[]>`
      SELECT "id", "nextNumber", "issuedCount"
      FROM "number_series"
      WHERE "accountId" = ${accountId} AND "documentType" = ${prismaType}::"DocumentType"
      FOR UPDATE
    `;
    const series = rows[0];
    if (!series) {
      throw new Error('number_series row missing after insert');
    }

    let numberToClaim = series.nextNumber;
    if (overrideNumber !== undefined) {
      if (series.issuedCount > 0) {
        throw new DomainError(
          'SERIES_OVERRIDE_LOCKED',
          'The next number cannot be overridden once the series has issued documents.',
        );
      }
      numberToClaim = BigInt(overrideNumber);
    }

    const collision = await tx.document.findFirst({
      where: { accountId, documentType: prismaType, number: numberToClaim },
      select: { id: true },
    });
    if (collision) {
      throw new DomainError(
        'NUMBER_COLLISION',
        `Number ${numberToClaim.toString()} is already in use.`,
      );
    }

    await tx.numberSeries.update({
      where: { id: series.id },
      data: { nextNumber: numberToClaim + 1n, issuedCount: { increment: 1 } },
    });

    return numberToClaim;
  }

  async getSeriesInfo(accountId: string): Promise<SeriesInfoDto[]> {
    const rows = await this.prisma.numberSeries.findMany({ where: { accountId } });
    const byType = new Map(rows.map((row) => [row.documentType, row]));
    return DOCUMENT_TYPES.map((documentType) => {
      const row = byType.get(toPrismaDocumentType(documentType));
      if (!row) {
        return { documentType, previousNumber: null, nextNumber: 1, overridable: true };
      }
      return {
        documentType,
        previousNumber: row.issuedCount > 0 ? Number(row.nextNumber) - 1 : null,
        nextNumber: Number(row.nextNumber),
        overridable: row.issuedCount === 0,
      };
    });
  }
}
