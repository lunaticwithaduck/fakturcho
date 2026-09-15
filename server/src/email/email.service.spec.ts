import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DomainError } from '../common/domain-error';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { EmailService } from './email.service';
import type { DocumentRenderer, EmailSender, SendEmailInput } from './ports';

describe('EmailService', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
    await db.prisma.featureFlag.update({ where: { key: 'EN_LOCALE' }, data: { enabled: true } });
  });

  afterAll(async () => {
    await db.stop();
  });

  async function createAccountWithUser(localPart: string) {
    const account = await db.prisma.account.create({ data: {} });
    const userEmail = `${localPart}_${account.id}@example.com`;
    await db.prisma.user.create({
      data: {
        id: `usr_${account.id}`,
        name: 'Тест Тестов',
        email: userEmail,
        accountId: account.id,
      },
    });
    return { account, userEmail };
  }

  it('renders the document, sends the email and persists emailText/emailedAt', async () => {
    const { account, userEmail } = await createAccountWithUser('owner');
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
    expect(sentInput?.issuerName).toBeNull();
    expect(sentInput?.replyTo).toBe(userEmail);

    const updated = await db.prisma.document.findUniqueOrThrow({ where: { id: document.id } });
    expect(updated.emailText).toBe('Здравейте, прилагаме фактурата.');
    expect(updated.emailedAt).not.toBeNull();
  });

  it('resolves an English subject and locale for a document with documentLanguage=en', async () => {
    const { account } = await createAccountWithUser('owner');
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
    const { account } = await createAccountWithUser('owner');
    const document = await db.prisma.document.create({
      data: {
        accountId: account.id,
        documentType: 'INVOICE',
        status: 'SENT',
        number: 9n,
        issuerCountry: 'NL',
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

  it('legacy: an issued document with a null issuerCountry emails in bg regardless of the recipient country', async () => {
    const { account } = await createAccountWithUser('legacy');
    const document = await db.prisma.document.create({
      data: {
        accountId: account.id,
        documentType: 'INVOICE',
        status: 'SENT',
        number: 24n,
        recipientCountry: 'FR',
      },
    });

    const renderPdf = vi.fn(async () => ({
      buffer: Buffer.from('%PDF-1.4 fake'),
      filename: 'Invoice_0000000024.pdf',
    }));
    const renderer: DocumentRenderer = { renderPdf };
    const send = vi.fn(async (_input: SendEmailInput): Promise<void> => {});
    const sender: EmailSender = { send };

    const service = new EmailService(db.prisma as unknown as PrismaService, renderer, sender);

    await service.sendDocumentEmail(account.id, document.id, {
      to: 'client@example.com',
      emailText: 'x',
    });

    const sentInput = send.mock.calls[0]?.[0];
    expect(sentInput?.locale).toBe('bg');
    expect(sentInput?.subject).toBe('Фактура № 0000000024');
  });

  it('passes the issuer company name and the account user email as reply-to', async () => {
    const { account, userEmail } = await createAccountWithUser('boyko');
    const document = await db.prisma.document.create({
      data: {
        accountId: account.id,
        documentType: 'INVOICE',
        status: 'SENT',
        number: 3n,
        issuerCompanyName: 'Бояна ЕООД',
      },
    });

    const renderer: DocumentRenderer = {
      renderPdf: vi.fn(async () => ({ buffer: Buffer.from(''), filename: 'x.pdf' })),
    };
    const send = vi.fn(async (_input: SendEmailInput): Promise<void> => {});
    const sender: EmailSender = { send };

    const service = new EmailService(db.prisma as unknown as PrismaService, renderer, sender);

    await service.sendDocumentEmail(account.id, document.id, {
      to: 'client@example.com',
      emailText: 'x',
    });

    const sentInput = send.mock.calls[0]?.[0];
    expect(sentInput?.issuerName).toBe('Бояна ЕООД');
    expect(sentInput?.replyTo).toBe(userEmail);
  });

  it('refuses to email a draft — it renders nothing and sends nothing', async () => {
    const { account } = await createAccountWithUser('owner');
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

  it('fails with a clear DomainError instead of sending without a reply-to when the account has no user', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const document = await db.prisma.document.create({
      data: { accountId: account.id, documentType: 'INVOICE', status: 'SENT', number: 21n },
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
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    expect(renderPdf).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('EN_LOCALE off: falls back to a Bulgarian subject and locale despite documentLanguage=en', async () => {
    const { account } = await createAccountWithUser('owner');
    const document = await db.prisma.document.create({
      data: {
        accountId: account.id,
        documentType: 'CREDIT_NOTE',
        status: 'SENT',
        number: 8n,
        documentLanguage: 'en',
      },
    });

    const flags = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    await flags.setEnabled('EN_LOCALE', false);

    const renderPdf = vi.fn(async () => ({
      buffer: Buffer.from('%PDF-1.4 fake'),
      filename: 'Кредитно известие_0000000008.pdf',
    }));
    const renderer: DocumentRenderer = { renderPdf };
    const send = vi.fn(async (_input: SendEmailInput): Promise<void> => {});
    const sender: EmailSender = { send };

    const service = new EmailService(
      db.prisma as unknown as PrismaService,
      renderer,
      sender,
      flags,
    );

    await service.sendDocumentEmail(account.id, document.id, {
      to: 'client@example.com',
      emailText: 'x',
    });

    const sentInput = send.mock.calls[0]?.[0];
    expect(sentInput?.locale).toBe('bg');
    expect(sentInput?.subject).toBe('Кредитно известие № 0000000008');

    await flags.setEnabled('EN_LOCALE', true);
  });
});
