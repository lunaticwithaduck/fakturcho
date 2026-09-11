import { describe, expect, it } from 'vitest';
import { DomainError } from '../common/domain-error';
import { NotConfiguredPeppolTransport } from './not-configured-peppol-transport';

describe('NotConfiguredPeppolTransport', () => {
  it('refuses to send, naming Peppol as the unconfigured provider', async () => {
    const transport = new NotConfiguredPeppolTransport();

    await expect(
      transport.send({
        documentId: 'doc-1',
        peppolEndpointId: '0088:bg123',
        peppolScheme: 'iso6523-actorid-upis',
        ublXml: '<Invoice/>',
      }),
    ).rejects.toMatchObject({ code: 'EINVOICE_TRANSPORT_NOT_CONFIGURED' });
  });

  it('refuses a participant lookup the same way', async () => {
    const transport = new NotConfiguredPeppolTransport();

    await expect(
      transport.lookupParticipant('0088:bg123', 'iso6523-actorid-upis'),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
