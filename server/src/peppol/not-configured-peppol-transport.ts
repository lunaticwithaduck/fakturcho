import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import type {
  PeppolLookupResult,
  PeppolSendParams,
  PeppolSendResult,
  PeppolTransport,
} from './peppol-transport.interface';

const NOT_CONFIGURED_MESSAGE = 'Peppol access point not configured';

@Injectable()
export class NotConfiguredPeppolTransport implements PeppolTransport {
  readonly providerName = 'peppol';

  async send(_params: PeppolSendParams): Promise<PeppolSendResult> {
    throw new DomainError('EINVOICE_TRANSPORT_NOT_CONFIGURED', NOT_CONFIGURED_MESSAGE);
  }

  async lookupParticipant(
    _peppolEndpointId: string,
    _peppolScheme: string,
  ): Promise<PeppolLookupResult> {
    throw new DomainError('EINVOICE_TRANSPORT_NOT_CONFIGURED', NOT_CONFIGURED_MESSAGE);
  }
}
