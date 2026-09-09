import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { EmailService } from './email.service';
import type { DocumentRenderer, EmailSender, SendEmailInput } from './ports';

describe('EmailService', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it('renders the document, sends the email and persists emailText/emailedAt', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const document = await db.prisma.document.create({
      data: { accountId: account.id, documentType: 'INVOICE', status: 'SENT', number: 16n },
    });

    const renderPdf = vi.fn(async (_documentId: string, _accountId: string) => ({
      buffer: Buffer.from('%PDF-1.4 fake'),
      filename: 'Фактура_0000000016.pdf',
    }));
    const renderer: DocumentRenderer = { renderPdf };

    const send = vi.fn(async (_input: SendEmailInput): Promise<void> => {});
    const sender: EmailSender = { send };

    const service = new EmailService(db.prisma as unknown as PrismaService, renderer, sender);

    await service.sendDocumentEmail(account.id, document.id, {
      to: 'client@example.com',
      emailText: 'Здравейте, прилагаме фактурата.',
    });

    expect(renderPdf).toHaveBeenCalledWith(document.id, account.id);
    expect(send).toHaveBeenCalledTimes(1);
    const sentInput = send.mock.calls[0]?.[0];
    expect(sentInput?.to).toBe('client@example.com');
    expect(sentInput?.subject).toBe('Фактура № 0000000016');
    expect(sentInput?.locale).toBe('bg');
    expect(sentInput?.attachment.filename).toBe('Фактура_0000000016.pdf');

    const updated = await db.prisma.document.findUniqueOrThrow({ where: { id: document.id } });
    expect(updated.emailText).toBe('Здравейте, прилагаме фактурата.');
    expect(updated.emailedAt).not.toBeNull();
  });

  it('resolves an English subject and locale for a document with documentLanguage=en', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const document = await db.prisma.document.create({
      data: {
        accountId: account.id,
        documentType: 'CREDIT_NOTE',
        status: 'SENT',
        number: 7n,
        documentLanguage: 'en',
      },
    });

    const renderPdf = vi.fn(async () => ({
      buffer: Buffer.from('%PDF-1.4 fake'),
      filename: 'Credit note_0000000007.pdf',
    }));
    const renderer: DocumentRenderer = { renderPdf };

    const send = vi.fn(async (_input: SendEmailInput): Promise<void> => {});
    const sender: EmailSender = { send };

    const service = new EmailService(db.prisma as unknown as PrismaService, renderer, sender);

    await service.sendDocumentEmail(account.id, document.id, {
      to: 'client@example.com',
      emailText: 'Hi, please find the credit note attached.',
    });

    const sentInput = send.mock.calls[0]?.[0];
    expect(sentInput?.subject).toBe('Credit note No. 0000000007');
    expect(sentInput?.locale).toBe('en');
  });

  it('derives English from the issuer country when documentLanguage is unset', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const document = await db.prisma.document.create({
      data: {
        accountId: account.id,
        documentType: 'INVOICE',
        status: 'SENT',
        number: 9n,
        issuerCountry: 'DE',
      },
    });

    const renderPdf = vi.fn(async () => ({
      buffer: Buffer.from('%PDF-1.4 fake'),
      filename: 'Invoice_0000000009.pdf',
    }));
    const renderer: DocumentRenderer = { renderPdf };

    const send = vi.fn(async (_input: SendEmailInput): Promise<void> => {});
    const sender: EmailSender = { send };

    const service = new EmailService(db.prisma as unknown as PrismaService, renderer, sender);

    await service.sendDocumentEmail(account.id, document.id, {
      to: 'client@example.com',
      emailText: 'Hi, invoice attached.',
    });

    const sentInput = send.mock.calls[0]?.[0];
    expect(sentInput?.subject).toBe('Invoice No. 0000000009');
    expect(sentInput?.locale).toBe('en');
  });

  it('refuses to email a draft — it renders nothing and sends nothing', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const document = await db.prisma.document.create({
      data: { accountId: account.id, documentType: 'INVOICE', status: 'DRAFT', number: null },
    });

    const renderPdf = vi.fn();
    const send = vi.fn();
    const service = new EmailService(
      db.prisma as unknown as PrismaService,
      { renderPdf } as unknown as DocumentRenderer,
      { send } as unknown as EmailSender,
    );

    await expect(
      service.sendDocumentEmail(account.id, document.id, {
        to: 'client@example.com',
        emailText: 'x',
      }),
    ).rejects.toMatchObject({ code: 'DOCUMENT_NOT_ISSUED' });

    expect(renderPdf).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();

    const untouched = await db.prisma.document.findUniqueOrThrow({ where: { id: document.id } });
    expect(untouched.emailedAt).toBeNull();
  });

  it('rejects a document that belongs to a different account', async () => {
    const accountA = await db.prisma.account.create({ data: {} });
    const accountB = await db.prisma.account.create({ data: {} });
    const document = await db.prisma.document.create({
      data: { accountId: accountA.id, documentType: 'INVOICE' },
    });

    const renderer: DocumentRenderer = { renderPdf: vi.fn() };
    const sender: EmailSender = { send: vi.fn() };
    const service = new EmailService(db.prisma as unknown as PrismaService, renderer, sender);

    await expect(
      service.sendDocumentEmail(accountB.id, document.id, {
        to: 'client@example.com',
        emailText: 'x',
      }),
    ).rejects.toThrow(DomainError);
  });
});
