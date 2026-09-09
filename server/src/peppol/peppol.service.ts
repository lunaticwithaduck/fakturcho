import { Inject, Injectable } from '@nestjs/common';
import { EinvoiceTransmissionStatus } from '@prisma/client';
import { PEPPOL_TRANSPORT, type PeppolTransport } from './peppol-transport.interface';

export interface PeppolTransmissionRecord {
  documentId: string;
  status: typeof EinvoiceTransmissionStatus.SENT | typeof EinvoiceTransmissionStatus.REJECTED;
  provider: string;
  providerMessageId: string;
  errorText?: string;
  retryCount: number;
}

@Injectable()
export class PeppolService {
  constructor(@Inject(PEPPOL_TRANSPORT) private readonly transport: PeppolTransport) {}

  async transmit(
    documentId: string,
    peppolEndpointId: string,
    peppolScheme: string,
    ublXml: string,
  ): Promise<PeppolTransmissionRecord> {
    const result = await this.transport.send({
      documentId,
      peppolEndpointId,
      peppolScheme,
      ublXml,
    });

    return {
      documentId,
      status:
        result.status === 'sent'
          ? EinvoiceTransmissionStatus.SENT
          : EinvoiceTransmissionStatus.REJECTED,
      provider: this.transport.providerName,
      providerMessageId: result.providerMessageId,
      ...(result.errorText !== undefined ? { errorText: result.errorText } : {}),
      retryCount: 0,
    };
  }
}
