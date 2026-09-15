import { describe, expect, it } from 'vitest';
import { MockXRechnungTransport } from './de-transport';

describe('MockXRechnungTransport.send', () => {
  it('returns sent with an incrementing providerMessageId for well-formed XML and a valid email', async () => {
    const transport = new MockXRechnungTransport();
    const first = await transport.send({
      documentId: 'doc-1',
      recipientEmail: 'buchhaltung@beispiel.de',
      xrechnungXml: '<Invoice>content</Invoice>',
      attachmentFileName: 'invoice-7.xml',
    });
    const second = await transport.send({
      documentId: 'doc-2',
      recipientEmail: 'buchhaltung@beispiel.de',
      xrechnungXml: '<Invoice>content</Invoice>',
      attachmentFileName: 'invoice-8.xml',
    });

    expect(first.status).toBe('sent');
    expect(second.status).toBe('sent');
    expect(first.providerMessageId).not.toBe(second.providerMessageId);
  });

  it('rejects an empty xrechnungXml with an errorText', async () => {
    const transport = new MockXRechnungTransport();
    const result = await transport.send({
      documentId: 'doc-1',
      recipientEmail: 'buchhaltung@beispiel.de',
      xrechnungXml: '',
      attachmentFileName: 'invoice-7.xml',
    });

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });

  it('rejects xrechnungXml that does not look like XML', async () => {
    const transport = new MockXRechnungTransport();
    const result = await transport.send({
      documentId: 'doc-1',
      recipientEmail: 'buchhaltung@beispiel.de',
      xrechnungXml: 'not xml at all',
      attachmentFileName: 'invoice-7.xml',
    });

    expect(result.status).toBe('rejected');
  });

  it('rejects a malformed recipient email', async () => {
    const transport = new MockXRechnungTransport();
    const result = await transport.send({
      documentId: 'doc-1',
      recipientEmail: 'not-an-email',
      xrechnungXml: '<Invoice>content</Invoice>',
      attachmentFileName: 'invoice-7.xml',
    });

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
  });
});

describe('MockXRechnungTransport.channel', () => {
  it('identifies itself as the email-attachment mock channel', () => {
    const transport = new MockXRechnungTransport();
    expect(transport.channel).toBe('email-attachment-mock');
  });
});
