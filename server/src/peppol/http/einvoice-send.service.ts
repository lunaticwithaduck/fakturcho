import { Injectable } from '@nestjs/common';
import { DomainError } from '../../common/domain-error';
import { DocumentsService } from '../../documents/documents.service';
import { EinvoiceTransportRegistry } from '../../einvoice/transport/transport-registry';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PeppolService } from '../peppol.service';
import { shouldRetry } from '../peppol-retry-policy';
import {
  buildEinvoiceXml,
  loadTransportRecipient,
  STATUS_BY_TRANSPORT_STATUS,
  sendViaPeppol,
  sendViaTransport,
} from './einvoice-send-routing';
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
    private readonly transportRegistry: EinvoiceTransportRegistry,
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
    const transport = this.transportRegistry.forCountry(document.issuer.country);

    if (transport && !transport.isConfigured()) {
      throw new DomainError(
        'EINVOICE_TRANSPORT_NOT_CONFIGURED',
        `${transport.providerName} is not configured for automatic e-invoice delivery.`,
      );
    }

    const xml = buildEinvoiceXml(document);
    const recipient = await loadTransportRecipient(this.prisma, accountId, document);

    const fields = transport
      ? await sendViaTransport(transport, documentId, document, xml, recipient)
      : await sendViaPeppol(this.peppolService, documentId, recipient, xml);

    const record = await this.prisma.einvoiceTransmission.upsert({
      where: { documentId },
      create: { documentId, ...fields, retryCount: nextRetryCount },
      update: { ...fields, retryCount: nextRetryCount },
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

  async refresh(accountId: string, documentId: string): Promise<EinvoiceTransmissionDto> {
    const document = await this.documentsService.get(accountId, documentId);
    const existing = await this.prisma.einvoiceTransmission.findUnique({ where: { documentId } });

    if (!existing) {
      throw new DomainError('NOT_FOUND', 'No e-invoice transmission exists for this document.');
    }

    const transport = this.transportRegistry.forCountry(document.issuer.country);

    if (!transport?.checkStatus) {
      throw new DomainError(
        'EINVOICE_STATUS_POLLING_NOT_SUPPORTED',
        `${transport ? transport.providerName : 'peppol'} does not support status polling.`,
      );
    }

    const statusResult = await transport.checkStatus(existing.providerMessageId ?? '');

    const record = await this.prisma.einvoiceTransmission.update({
      where: { documentId },
      data: {
        status: STATUS_BY_TRANSPORT_STATUS[statusResult.status],
        receipt: statusResult.receipt ?? null,
        errorText: statusResult.errorText ?? null,
      },
    });

    return toEinvoiceTransmissionDto(record);
  }
}
