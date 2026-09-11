import type { DocumentDto } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { DomainError } from '../../common/domain-error';
import { DocumentsService } from '../../documents/documents.service';
import { toUblXml } from '../../einvoice/ubl-mapper';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PeppolService } from '../peppol.service';
import { shouldRetry } from '../peppol-retry-policy';
import {
  type EinvoiceTransmissionDto,
  toEinvoiceTransmissionDto,
} from './einvoice-transmission.mapper';

@Injectable()
export class EinvoiceSendService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly peppolService: PeppolService,
  ) {}

  async send(accountId: string, documentId: string): Promise<EinvoiceTransmissionDto> {
    const document = await this.documentsService.get(accountId, documentId);

    if (document.status === 'draft' || document.status === 'cancelled') {
      throw new DomainError(
        'DOCUMENT_NOT_ISSUED',
        'Only issued documents can be sent as an e-invoice.',
      );
    }

    const existing = await this.prisma.einvoiceTransmission.findUnique({ where: { documentId } });

    if (existing && !shouldRetry({ status: existing.status, retryCount: existing.retryCount })) {
      throw new DomainError(
        'DOCUMENT_IMMUTABLE',
        existing.status === 'REJECTED'
          ? 'This e-invoice has been rejected too many times and can no longer be resent.'
          : 'This e-invoice has already been sent and cannot be resent.',
      );
    }

    const nextRetryCount = existing ? existing.retryCount + 1 : 0;

    const ublXml = this.buildUblXml(document);

    const client = document.clientId
      ? await this.prisma.client.findFirst({ where: { id: document.clientId, accountId } })
      : null;

    if (!client?.peppolEndpointId || !client?.peppolScheme) {
      throw new DomainError('VALIDATION_FAILED', 'The client has no Peppol endpoint registered.');
    }

    const result = await this.peppolService.transmit(
      documentId,
      client.peppolEndpointId,
      client.peppolScheme,
      ublXml,
    );

    const record = await this.prisma.einvoiceTransmission.upsert({
      where: { documentId },
      create: {
        documentId: result.documentId,
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        errorText: result.errorText ?? null,
        retryCount: nextRetryCount,
      },
      update: {
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        errorText: result.errorText ?? null,
        retryCount: nextRetryCount,
      },
    });

    return toEinvoiceTransmissionDto(record);
  }

  async getTransmission(
    accountId: string,
    documentId: string,
  ): Promise<EinvoiceTransmissionDto | null> {
    await this.documentsService.get(accountId, documentId);
    const record = await this.prisma.einvoiceTransmission.findUnique({ where: { documentId } });
    return record ? toEinvoiceTransmissionDto(record) : null;
  }

  private buildUblXml(document: DocumentDto): string {
    try {
      return toUblXml(document);
    } catch (error) {
      throw new DomainError(
        'VALIDATION_FAILED',
        error instanceof Error ? error.message : 'This document type has no e-invoice export.',
      );
    }
  }
}
