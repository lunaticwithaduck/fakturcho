import type { DocumentDto } from '@fakturcho/shared-types';

export interface EinvoiceTransportRecipient {
  peppolEndpointId: string | null;
  peppolScheme: string | null;
  sdiRecipientCode: string | null;
  pec: string | null;
  vatNumber: string | null;
  countyRegion: string | null;
}

export interface EinvoiceTransportSendParams {
  documentId: string;
  document: DocumentDto;
  xml: string;
  recipient: EinvoiceTransportRecipient;
}

export interface EinvoiceTransportSendResult {
  providerMessageId: string;
  status: 'sent' | 'rejected';
  errorText?: string;
  receipt?: string;
}

export interface EinvoiceTransportStatusResult {
  status: 'pending' | 'accepted' | 'rejected';
  errorText?: string;
  receipt?: string;
}

export interface EinvoiceTransport {
  readonly providerName: string;
  readonly country: string;
  isConfigured(): boolean;
  send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult>;
  checkStatus?(providerMessageId: string): Promise<EinvoiceTransportStatusResult>;
}

export const EINVOICE_TRANSPORTS = Symbol('EINVOICE_TRANSPORTS');
