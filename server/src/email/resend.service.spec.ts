import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn(async () => ({ data: { id: 'x' }, error: null }));

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

  it('sends bg mail from the .bg address by default', async () => {
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_FROM_BG;
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 'Фактура № 1',
      text: 'x',
      attachment: { filename: 'a.pdf', content: Buffer.from('') },
      locale: 'bg',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Fakturcho <invoices@fakturcho.bg>' }),
    );
  });

  it('sends en mail from the .com address by default', async () => {
    delete process.env.EMAIL_FROM_EN;
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 'Invoice No. 1',
      text: 'x',
      attachment: { filename: 'a.pdf', content: Buffer.from('') },
      locale: 'en',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Fakturcho <invoices@fakturcho.com>' }),
    );
  });

  it('honours EMAIL_FROM_BG / EMAIL_FROM_EN overrides', async () => {
    process.env.EMAIL_FROM_BG = 'BG Test <a@fakturcho.bg>';
    process.env.EMAIL_FROM_EN = 'EN Test <a@fakturcho.com>';
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 's',
      text: 't',
      attachment: { filename: 'f.pdf', content: Buffer.from('') },
      locale: 'en',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'EN Test <a@fakturcho.com>' }),
    );
  });

  it('falls back to legacy EMAIL_FROM for bg when EMAIL_FROM_BG is unset', async () => {
    delete process.env.EMAIL_FROM_BG;
    process.env.EMAIL_FROM = 'Legacy <legacy@fakturcho.bg>';
    const service = new ResendService();

    await service.send({
      to: 'client@example.com',
      subject: 's',
      text: 't',
      attachment: { filename: 'f.pdf', content: Buffer.from('') },
      locale: 'bg',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Legacy <legacy@fakturcho.bg>' }),
    );
  });
});
