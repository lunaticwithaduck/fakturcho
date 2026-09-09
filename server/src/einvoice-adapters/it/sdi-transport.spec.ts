import { describe, expect, it } from 'vitest';
import { itDomesticStandardInvoice } from './__fixtures__/it-domestic-standard';
import { toFatturaPaXml } from './fatturapa-mapper';
import { MockSdiTransport } from './sdi-transport';

describe('MockSdiTransport.submit', () => {
  it('accepts a well-formed FatturaPA XML payload with an incrementing sdiIdentifier', async () => {
    const transport = new MockSdiTransport();
    const xml = toFatturaPaXml(itDomesticStandardInvoice);

    const first = await transport.submit(xml);
    const second = await transport.submit(xml);

    expect(first.status).toBe('accepted');
    expect(second.status).toBe('accepted');
    expect(first.sdiIdentifier).toBeDefined();
    expect(second.sdiIdentifier).toBeDefined();
    expect(first.sdiIdentifier).not.toBe(second.sdiIdentifier);
  });

  it('rejects an empty payload with an errorText', async () => {
    const transport = new MockSdiTransport();
    const result = await transport.submit('');

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
    expect(result.sdiIdentifier).toBeUndefined();
  });

  it('rejects a payload that is not a FatturaPA document', async () => {
    const transport = new MockSdiTransport();
    const result = await transport.submit('<?xml version="1.0"?><Invoice>not fatturapa</Invoice>');

    expect(result.status).toBe('rejected');
  });

  it('rejects whitespace-only input', async () => {
    const transport = new MockSdiTransport();
    const result = await transport.submit('   \n  ');

    expect(result.status).toBe('rejected');
  });
});

describe('MockSdiTransport.checkStatus', () => {
  it('models the async SDI notification flow: sent_to_sdi then delivered', async () => {
    const transport = new MockSdiTransport();
    const xml = toFatturaPaXml(itDomesticStandardInvoice);
    const { sdiIdentifier } = await transport.submit(xml);
    if (!sdiIdentifier) throw new Error('expected a sdiIdentifier from a well-formed submission');

    const firstCheck = await transport.checkStatus(sdiIdentifier);
    const secondCheck = await transport.checkStatus(sdiIdentifier);

    expect(firstCheck.status).toBe('delivered');
    expect(secondCheck.status).toBe('delivered');
  });

  it('reports unknown for an identifier that was never submitted', async () => {
    const transport = new MockSdiTransport();
    expect(await transport.checkStatus('never-submitted')).toEqual({ status: 'unknown' });
  });
});
