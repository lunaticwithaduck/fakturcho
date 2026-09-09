import { describe, expect, it } from 'vitest';
import { MockPeppolTransport } from './mock-peppol-transport';

describe('MockPeppolTransport.lookupParticipant', () => {
  it('reports registered for an endpoint id containing "registered"', async () => {
    const transport = new MockPeppolTransport();
    await expect(
      transport.lookupParticipant('0088:registered-bg123', 'iso6523-actorid-upis'),
    ).resolves.toEqual({ registered: true });
  });

  it('reports not registered for any other endpoint id', async () => {
    const transport = new MockPeppolTransport();
    await expect(
      transport.lookupParticipant('0088:bg999999999', 'iso6523-actorid-upis'),
    ).resolves.toEqual({ registered: false });
  });
});

describe('MockPeppolTransport.send', () => {
  it('returns sent with an incrementing providerMessageId for well-formed XML', async () => {
    const transport = new MockPeppolTransport();
    const first = await transport.send({
      documentId: 'doc-1',
      peppolEndpointId: '0088:bg123',
      peppolScheme: 'iso6523-actorid-upis',
      ublXml: '<Invoice>content</Invoice>',
    });
    const second = await transport.send({
      documentId: 'doc-2',
      peppolEndpointId: '0088:bg123',
      peppolScheme: 'iso6523-actorid-upis',
      ublXml: '<Invoice>content</Invoice>',
    });

    expect(first.status).toBe('sent');
    expect(second.status).toBe('sent');
    expect(first.providerMessageId).not.toBe(second.providerMessageId);
  });

  it('rejects an empty ublXml with an errorText', async () => {
    const transport = new MockPeppolTransport();
    const result = await transport.send({
      documentId: 'doc-1',
      peppolEndpointId: '0088:bg123',
      peppolScheme: 'iso6523-actorid-upis',
      ublXml: '',
    });

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });

  it('rejects an ublXml that does not look like XML', async () => {
    const transport = new MockPeppolTransport();
    const result = await transport.send({
      documentId: 'doc-1',
      peppolEndpointId: '0088:bg123',
      peppolScheme: 'iso6523-actorid-upis',
      ublXml: 'not xml at all',
    });

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });

  it('rejects whitespace-only ublXml', async () => {
    const transport = new MockPeppolTransport();
    const result = await transport.send({
      documentId: 'doc-1',
      peppolEndpointId: '0088:bg123',
      peppolScheme: 'iso6523-actorid-upis',
      ublXml: '   \n  ',
    });

    expect(result.status).toBe('rejected');
  });
});
