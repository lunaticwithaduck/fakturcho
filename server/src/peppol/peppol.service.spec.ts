import { EinvoiceTransmissionStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PeppolService } from './peppol.service';
import type {
  PeppolSendParams,
  PeppolSendResult,
  PeppolTransport,
} from './peppol-transport.interface';

function fakeTransport(
  send: (params: PeppolSendParams) => Promise<PeppolSendResult>,
): PeppolTransport {
  return {
    providerName: 'fake',
    send,
    lookupParticipant: async () => ({ registered: true }),
  };
}

describe('PeppolService.transmit', () => {
  it('maps a sent result onto the EinvoiceTransmission writable fields', async () => {
    const transport = fakeTransport(async () => ({
      providerMessageId: 'msg-1',
      status: 'sent',
    }));
    const service = new PeppolService(transport);

    const record = await service.transmit(
      'doc-1',
      '0088:bg123',
      'iso6523-actorid-upis',
      '<Invoice/>',
    );

    expect(record).toEqual({
      documentId: 'doc-1',
      status: EinvoiceTransmissionStatus.SENT,
      provider: 'fake',
      providerMessageId: 'msg-1',
      retryCount: 0,
    });
  });

  it('maps a rejected result to REJECTED and carries the errorText', async () => {
    const transport = fakeTransport(async () => ({
      providerMessageId: '',
      status: 'rejected',
      errorText: 'malformed ublXml',
    }));
    const service = new PeppolService(transport);

    const record = await service.transmit('doc-2', '0088:bg123', 'iso6523-actorid-upis', '');

    expect(record).toEqual({
      documentId: 'doc-2',
      status: EinvoiceTransmissionStatus.REJECTED,
      provider: 'fake',
      providerMessageId: '',
      errorText: 'malformed ublXml',
      retryCount: 0,
    });
  });

  it('passes the send params through unchanged', async () => {
    let captured: PeppolSendParams | undefined;
    const transport = fakeTransport(async (params) => {
      captured = params;
      return { providerMessageId: 'msg-3', status: 'sent' };
    });
    const service = new PeppolService(transport);

    await service.transmit('doc-3', '0088:bg999', 'iso6523-actorid-upis', '<Invoice/>');

    expect(captured).toEqual({
      documentId: 'doc-3',
      peppolEndpointId: '0088:bg999',
      peppolScheme: 'iso6523-actorid-upis',
      ublXml: '<Invoice/>',
    });
  });
});
