import { describe, expect, it } from 'vitest';
import { MockAnafTransport } from './anaf-transport';

describe('MockAnafTransport.authenticate', () => {
  it('resolves with a deterministic mock access token', async () => {
    const transport = new MockAnafTransport();
    await expect(transport.authenticate()).resolves.toEqual({
      accessToken: 'mock-anaf-access-token',
      expiresAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('MockAnafTransport.upload', () => {
  it('returns uploaded with an incrementing upload index for well-formed XML', async () => {
    const transport = new MockAnafTransport();
    const first = await transport.upload('<Invoice>content</Invoice>');
    const second = await transport.upload('<Invoice>content</Invoice>');

    expect(first.status).toBe('uploaded');
    expect(second.status).toBe('uploaded');
    expect(first.uploadIndex).toBeDefined();
    expect(second.uploadIndex).toBeDefined();
    expect(first.uploadIndex).not.toBe(second.uploadIndex);
  });

  it('rejects an empty XML payload with an errorText and no upload index', async () => {
    const transport = new MockAnafTransport();
    const result = await transport.upload('');

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
    expect(result.uploadIndex).toBeUndefined();
  });

  it('rejects a payload that does not look like XML', async () => {
    const transport = new MockAnafTransport();
    const result = await transport.upload('not xml at all');

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });
});

describe('MockAnafTransport.checkStatus', () => {
  it('reports processing on the first poll and accepted from the second poll onward', async () => {
    const transport = new MockAnafTransport();
    const { uploadIndex } = await transport.upload('<Invoice>content</Invoice>');
    if (!uploadIndex) throw new Error('expected an upload index for a well-formed upload');

    const firstPoll = await transport.checkStatus(uploadIndex);
    const secondPoll = await transport.checkStatus(uploadIndex);
    const thirdPoll = await transport.checkStatus(uploadIndex);

    expect(firstPoll.status).toBe('processing');
    expect(secondPoll.status).toBe('accepted');
    expect(thirdPoll.status).toBe('accepted');
  });

  it('rejects with an errorText for an unknown upload index', async () => {
    const transport = new MockAnafTransport();
    const result = await transport.checkStatus('never-uploaded');

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });

  it('tracks poll state independently per upload index', async () => {
    const transport = new MockAnafTransport();
    const uploadA = await transport.upload('<Invoice>a</Invoice>');
    const uploadB = await transport.upload('<Invoice>b</Invoice>');
    if (!uploadA.uploadIndex || !uploadB.uploadIndex) {
      throw new Error('expected upload indexes for well-formed uploads');
    }

    await transport.checkStatus(uploadA.uploadIndex);
    await transport.checkStatus(uploadA.uploadIndex);
    const bFirstPoll = await transport.checkStatus(uploadB.uploadIndex);

    expect(bFirstPoll.status).toBe('processing');
  });
});
