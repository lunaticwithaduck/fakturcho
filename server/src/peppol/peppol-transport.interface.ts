export interface PeppolSendParams {
  documentId: string;
  peppolEndpointId: string;
  peppolScheme: string;
  ublXml: string;
}

export interface PeppolSendResult {
  providerMessageId: string;
  status: 'sent' | 'rejected';
  errorText?: string;
}

export interface PeppolLookupResult {
  registered: boolean;
}

export interface PeppolTransport {
  readonly providerName: string;
  send(params: PeppolSendParams): Promise<PeppolSendResult>;
  lookupParticipant(peppolEndpointId: string, peppolScheme: string): Promise<PeppolLookupResult>;
}

export const PEPPOL_TRANSPORT = Symbol('PEPPOL_TRANSPORT');
