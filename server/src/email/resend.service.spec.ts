import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface SendResult {
  data: { id: string } | null;
  error: { message: string } | null;
}

const sendMock = vi.fn<() => Promise<SendResult>>(async () => ({ data: { id: 'x' }, error: null }));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

import { ResendService } from './resend.service';

describe('ResendService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    sendMock.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('sends from Fakturcho with the user as reply-to when the document has no issuer name', async () => {
    delete process.env.EMAIL_FROM;
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 'Фактура № 1',
      text: 'x',
      attachment: { filename: 'a.pdf', content: Buffer.from('') },
      locale: 'bg',
      issuerName: null,
      replyTo: 'owner@example.com',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Fakturcho <invoices@fakturcho.bg>',
        replyTo: 'owner@example.com',
      }),
    );
  });

  it('names the issuer in the From display name and keeps the verified address, for either locale', async () => {
    delete process.env.EMAIL_FROM;
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 'Invoice No. 1',
      text: 'x',
      attachment: { filename: 'a.pdf', content: Buffer.from('') },
      locale: 'en',
      issuerName: 'Acme Ltd',
      replyTo: 'owner@example.com',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Acme Ltd via Fakturcho <invoices@fakturcho.bg>' }),
    );
  });

  it('honours EMAIL_FROM for the sender address, dropping any locale split', async () => {
    process.env.EMAIL_FROM = 'Fakturcho <invoices@custom.example>';
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 's',
      text: 't',
      attachment: { filename: 'f.pdf', content: Buffer.from('') },
      locale: 'en',
      issuerName: 'Acme',
      replyTo: 'owner@example.com',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Acme via Fakturcho <invoices@custom.example>' }),
    );
  });

  it('quotes an issuer name that contains a comma', async () => {
    delete process.env.EMAIL_FROM;
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 's',
      text: 't',
      attachment: { filename: 'f.pdf', content: Buffer.from('') },
      locale: 'bg',
      issuerName: 'Smith, Jones & Co',
      replyTo: 'owner@example.com',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Smith, Jones & Co via Fakturcho" <invoices@fakturcho.bg>',
      }),
    );
  });

  it('quotes and escapes an issuer name that contains a double quote', async () => {
    delete process.env.EMAIL_FROM;
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 's',
      text: 't',
      attachment: { filename: 'f.pdf', content: Buffer.from('') },
      locale: 'bg',
      issuerName: 'The "Best" Bakery',
      replyTo: 'owner@example.com',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"The \\"Best\\" Bakery via Fakturcho" <invoices@fakturcho.bg>',
      }),
    );
  });

  it('RFC 2047-encodes a Cyrillic issuer name', async () => {
    delete process.env.EMAIL_FROM;
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 'Фактура № 1',
      text: 'x',
      attachment: { filename: 'a.pdf', content: Buffer.from('') },
      locale: 'bg',
      issuerName: 'Иванов ЕООД',
      replyTo: 'owner@example.com',
    });

    const expectedName = `=?UTF-8?B?${Buffer.from('Иванов ЕООД via Fakturcho', 'utf8').toString('base64')}?=`;
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: `${expectedName} <invoices@fakturcho.bg>` }),
    );
  });

  it('throws when Resend reports an error', async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'bad request' } });
    const service = new ResendService();

    await expect(
      service.send({
        to: 'client@example.com',
        subject: 's',
        text: 't',
        attachment: { filename: 'f.pdf', content: Buffer.from('') },
        locale: 'bg',
        issuerName: null,
        replyTo: 'owner@example.com',
      }),
    ).rejects.toThrow('bad request');
  });
});
