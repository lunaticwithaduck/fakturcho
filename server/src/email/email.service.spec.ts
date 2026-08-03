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
      data: { accountId: account.id, documentType: 'INVOICE', number: 16n },
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
    expect(sentInput?.attachment.filename).toBe('Фактура_0000000016.pdf');

    const updated = await db.prisma.document.findUniqueOrThrow({ where: { id: document.id } });
    expect(updated.emailText).toBe('Здравейте, прилагаме фактурата.');
    expect(updated.emailedAt).not.toBeNull();
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
