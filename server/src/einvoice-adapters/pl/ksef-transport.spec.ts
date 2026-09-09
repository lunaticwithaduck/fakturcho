import { describe, expect, it } from 'vitest';
import { MockKsefTransport } from './ksef-transport';

describe('MockKsefTransport.authenticate', () => {
  it('returns a session token', async () => {
    const transport = new MockKsefTransport();
    const result = await transport.authenticate();
    expect(result.token).toBeTruthy();
  });

  it('returns a distinct token per session', async () => {
    const transport = new MockKsefTransport();
    const first = await transport.authenticate();
    const second = await transport.authenticate();
    expect(first.token).not.toBe(second.token);
  });
});

describe('MockKsefTransport.submit', () => {
  it('rejects submission without a session token', async () => {
    const transport = new MockKsefTransport();
    const result = await transport.submit('<Faktura>content</Faktura>', '');
    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });

  it('rejects malformed FA(3) XML', async () => {
    const transport = new MockKsefTransport();
    const { token } = await transport.authenticate();
    const result = await transport.submit('not xml at all', token);
    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });

  it('rejects empty FA(3) XML', async () => {
    const transport = new MockKsefTransport();
    const { token } = await transport.authenticate();
    const result = await transport.submit('   ', token);
    expect(result.status).toBe('rejected');
  });

  it('accepts well-formed XML with a valid token and returns a reference number', async () => {
    const transport = new MockKsefTransport();
    const { token } = await transport.authenticate();
    const result = await transport.submit('<Faktura>content</Faktura>', token);
    expect(result.status).toBe('processing');
    expect(result.ksefReferenceNumber).toBeTruthy();
  });

  it('returns distinct reference numbers for successive submissions', async () => {
    const transport = new MockKsefTransport();
    const { token } = await transport.authenticate();
    const first = await transport.submit('<Faktura>a</Faktura>', token);
    const second = await transport.submit('<Faktura>b</Faktura>', token);
    expect(first.ksefReferenceNumber).not.toBe(second.ksefReferenceNumber);
  });
});

describe('MockKsefTransport — authenticate, submit, poll flow', () => {
  it('reports processing on the first poll and accepted with a KSeF number afterwards', async () => {
    const transport = new MockKsefTransport();
    const { token } = await transport.authenticate();
    const submitResult = await transport.submit('<Faktura>content</Faktura>', token);
    const referenceNumber = submitResult.ksefReferenceNumber;
    if (!referenceNumber) throw new Error('expected a KSeF reference number');

    const firstPoll = await transport.checkStatus(referenceNumber);
    expect(firstPoll.status).toBe('processing');
    expect(firstPoll.ksefNumber).toBeUndefined();

    const secondPoll = await transport.checkStatus(referenceNumber);
    expect(secondPoll.status).toBe('accepted');
    expect(secondPoll.ksefNumber).toBeTruthy();
    expect(secondPoll.qrCode).toBeTruthy();
  });

  it('rejects a status check for an unknown reference number', async () => {
    const transport = new MockKsefTransport();
    const result = await transport.checkStatus('unknown-ref');
    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });
});
