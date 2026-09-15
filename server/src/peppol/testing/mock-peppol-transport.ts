import { Injectable } from '@nestjs/common';
import type {
  PeppolLookupResult,
  PeppolSendParams,
  PeppolSendResult,
  PeppolTransport,
} from '../peppol-transport.interface';

function looksMalformed(ublXml: string): boolean {
  const trimmed = ublXml.trim();
  return trimmed === '' || !trimmed.startsWith('<') || !trimmed.endsWith('>');
}

@Injectable()
export class MockPeppolTransport implements PeppolTransport {
  readonly providerName = 'mock';

  private counter = 0;

  async send(params: PeppolSendParams): Promise<PeppolSendResult> {
    if (looksMalformed(params.ublXml)) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: 'UBL XML payload is empty or malformed',
      };
    }
    this.counter += 1;
    return {
      providerMessageId: `mock-${this.counter}`,
      status: 'sent',
    };
  }

  async lookupParticipant(
    peppolEndpointId: string,
    _peppolScheme: string,
  ): Promise<PeppolLookupResult> {
    return { registered: peppolEndpointId.includes('registered') };
  }
}
