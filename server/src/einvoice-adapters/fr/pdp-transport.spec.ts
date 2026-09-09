import { describe, expect, it } from 'vitest';
import { MockPdpTransport } from './pdp-transport';

describe('MockPdpTransport.submit', () => {
  it('returns sent with an incrementing transmissionId for well-formed XML', async () => {
    const transport = new MockPdpTransport();
    const first = await transport.submit('<Invoice>content</Invoice>');
    const second = await transport.submit('<Invoice>content</Invoice>');

    expect(first.status).toBe('sent');
    expect(second.status).toBe('sent');
    expect(first.transmissionId).toBeDefined();
    expect(first.transmissionId).not.toBe(second.transmissionId);
  });

  it('rejects an empty payload with an errorText', async () => {
    const transport = new MockPdpTransport();
    const result = await transport.submit('');

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
    expect(result.transmissionId).toBeUndefined();
  });

  it('rejects a payload that does not look like XML', async () => {
    const transport = new MockPdpTransport();
    const result = await transport.submit('not xml at all');

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });

  it('rejects whitespace-only payloads', async () => {
    const transport = new MockPdpTransport();
    const result = await transport.submit('   \n  ');

    expect(result.status).toBe('rejected');
  });
});

describe('MockPdpTransport.checkStatus', () => {
  it('reports delivered for a transmissionId returned by submit', async () => {
    const transport = new MockPdpTransport();
    const { transmissionId } = await transport.submit('<Invoice>content</Invoice>');
    if (!transmissionId) throw new Error('expected a transmissionId from a successful submit');

    await expect(transport.checkStatus(transmissionId)).resolves.toEqual({
      status: 'delivered',
    });
  });

  it('reports unknown for a transmissionId it has never issued', async () => {
    const transport = new MockPdpTransport();
    await expect(transport.checkStatus('never-issued')).resolves.toEqual({ status: 'unknown' });
  });
});
