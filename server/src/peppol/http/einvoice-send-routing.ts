import type { DocumentDto } from '@fakturcho/shared-types';
import { EinvoiceTransmissionStatus } from '@prisma/client';
import { DomainError } from '../../common/domain-error';
import { selectEinvoiceXmlMapper } from '../../einvoice/http/einvoice-mapper-selection';
import type {
  EinvoiceTransport,
  EinvoiceTransportRecipient,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { PeppolService } from '../peppol.service';

export interface TransmissionWriteFields {
  status: EinvoiceTransmissionStatus;
  provider: string;
  providerMessageId: string;
  receipt: string | null;
  errorText: string | null;
}

export const STATUS_BY_TRANSPORT_STATUS: Record<
  EinvoiceTransportStatusResult['status'],
  EinvoiceTransmissionStatus
> = {
  pending: EinvoiceTransmissionStatus.PENDING,
  accepted: EinvoiceTransmissionStatus.ACCEPTED,
  rejected: EinvoiceTransmissionStatus.REJECTED,
};

export function buildEinvoiceXml(document: DocumentDto): string {
  try {
    return selectEinvoiceXmlMapper(document.issuer.country)(document);
  } catch (error) {
    throw new DomainError(
      'VALIDATION_FAILED',
      error instanceof Error ? error.message : 'This document type has no e-invoice export.',
    );
  }
}

export async function loadTransportRecipient(
  prisma: PrismaService,
  accountId: string,
  document: DocumentDto,
): Promise<EinvoiceTransportRecipient> {
  const client = document.clientId
    ? await prisma.client.findFirst({ where: { id: document.clientId, accountId } })
    : null;

  return {
    peppolEndpointId: client?.peppolEndpointId ?? null,
    peppolScheme: client?.peppolScheme ?? null,
    sdiRecipientCode: client?.sdiRecipientCode ?? null,
    pec: client?.pec ?? null,
    vatNumber: client?.vatNumber ?? null,
    countyRegion: client?.countyRegion ?? null,
  };
}

export async function sendViaTransport(
  transport: EinvoiceTransport,
  documentId: string,
  document: DocumentDto,
  xml: string,
  recipient: EinvoiceTransportRecipient,
): Promise<TransmissionWriteFields> {
  const result = await transport.send({ documentId, document, xml, recipient });

  return {
    status:
      result.status === 'sent'
        ? EinvoiceTransmissionStatus.SENT
        : EinvoiceTransmissionStatus.REJECTED,
    provider: transport.providerName,
    providerMessageId: result.providerMessageId,
    receipt: result.receipt ?? null,
    errorText: result.errorText ?? null,
  };
}

export async function sendViaPeppol(
  peppolService: PeppolService,
  documentId: string,
  recipient: EinvoiceTransportRecipient,
  xml: string,
): Promise<TransmissionWriteFields> {
  if (!recipient.peppolEndpointId || !recipient.peppolScheme) {
    throw new DomainError('VALIDATION_FAILED', 'The client has no Peppol endpoint registered.');
  }

  const result = await peppolService.transmit(
    documentId,
    recipient.peppolEndpointId,
    recipient.peppolScheme,
    xml,
  );

  return {
    status: result.status,
    provider: result.provider,
    providerMessageId: result.providerMessageId,
    receipt: null,
    errorText: result.errorText ?? null,
  };
}
