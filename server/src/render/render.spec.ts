import { DEFAULT_EXEMPTION_GROUND } from '@fakturcho/shared-types';
import type { Response } from 'express';
import { extractText, getDocumentProxy } from 'unpdf';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';
import { seedDocument } from './testing/seed-document';

function createMockResponse() {
  const headers: Record<string, string> = {};
  let sentBuffer: Buffer | null = null;
  const res = {
    setHeader(key: string, value: string) {
      headers[key] = value;
    },
    send(buffer: Buffer) {
      sentBuffer = buffer;
    },
  } as unknown as Response;
  return { res, headers, getSentBuffer: () => sentBuffer };
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const doc = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(doc, { mergePages: true });
  return text;
}

describe('render pipeline', () => {
  let db: TestDatabase;
  let service: RenderService;
  let controller: RenderController;
  let accountId: string;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new RenderService(db.prisma as unknown as PrismaService);
    await service.onModuleInit();
    controller = new RenderController(service);
    const account = await db.prisma.account.create({ data: {} });
    accountId = account.id;
  }, 180_000);

  afterAll(async () => {
    await service.onModuleDestroy();
    await db.stop();
  });

  it('invariant 17: full Cyrillic + € + лв. round-trips with no missing glyphs', async () => {
    const document = await seedDocument(db.prisma, { accountId, number: 1 });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).toContain('"Тестова Компания" ЕООД');
    expect(text).toContain('"Клиентска Фирма" ООД');
    expect(text).toContain('Мария Петрова');
    expect(text).toContain('Петър Георгиев');
    expect(text).toContain('€');
    expect(text).toContain('лв.');
    expect(text).toContain('ПЕТ ХИЛЯДИ И ПЕТСТОТИН EUR И 00 ЦЕНТА');
  });

  it('invariant 18: the IBAN is never hyphenated or broken mid-string', async () => {
    const document = await seedDocument(db.prisma, { accountId, number: 2 });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).toContain('BG80BNBG96611020345678');
  });

  it('a sent invoice carries (Оригинал) after the number', async () => {
    const document = await seedDocument(db.prisma, {
      accountId,
      documentType: 'INVOICE',
      number: 3,
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).toContain('Фактура # 0000000003 (Оригинал)');
  });

  it('invariant 14: proforma renders without (Оригинал) and without an exemption line', async () => {
    const document = await seedDocument(db.prisma, {
      accountId,
      documentType: 'PROFORMA',
      overrides: { issuerVatRegistered: false, vatRateBp: 0, vatExemptionGround: null },
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).not.toContain('Оригинал');
    expect(text).not.toContain('Основание за неначисляване');
  });

  it('invariant 14: quote renders without (Оригинал) and without an exemption line', async () => {
    const document = await seedDocument(db.prisma, {
      accountId,
      documentType: 'QUOTE',
      overrides: { issuerVatRegistered: false, vatRateBp: 0, vatExemptionGround: null },
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).not.toContain('Оригинал');
    expect(text).not.toContain('Основание за неначисляване');
  });

  it('invariant 15: quote shows Валидно до and no Данъчно събитие', async () => {
    const document = await seedDocument(db.prisma, { accountId, documentType: 'QUOTE', number: 6 });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).toContain('Валидно до');
    expect(text).not.toContain('Данъчно събитие');
  });

  it('an invoice shows Данъчно събитие and no Валидно до', async () => {
    const document = await seedDocument(db.prisma, {
      accountId,
      documentType: 'INVOICE',
      number: 4,
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).toContain('Данъчно събитие');
    expect(text).not.toContain('Валидно до');
  });

  it('an unregistered issuer prints the default exemption ground on a tax document', async () => {
    const document = await seedDocument(db.prisma, {
      accountId,
      documentType: 'INVOICE',
      number: 5,
      overrides: {
        issuerVatRegistered: false,
        vatRateBp: 0,
        vatExemptionGround: DEFAULT_EXEMPTION_GROUND,
      },
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).toContain('Основание за неначисляване на ДДС: чл.113, ал.9 от ЗДДС');
  });

  it('invariant 16: Content-Disposition carries an ASCII fallback and RFC 5987 filename*', async () => {
    const document = await seedDocument(db.prisma, { accountId, number: 16 });
    const { res, headers, getSentBuffer } = createMockResponse();
    await controller.render(document.id, accountId, res);

    const disposition = headers['Content-Disposition'];
    expect(disposition).toBeDefined();
    expect(disposition).toContain('attachment;');

    const asciiMatch = /filename="([^"]+)"/.exec(disposition ?? '');
    expect(asciiMatch).not.toBeNull();
    const asciiFilename = asciiMatch?.[1] ?? '';
    expect(asciiFilename.length).toBeGreaterThan(0);
    expect(/^[\x20-\x7E]+$/.test(asciiFilename)).toBe(true);

    const utf8Match = /filename\*=UTF-8''([^;]+)/.exec(disposition ?? '');
    expect(utf8Match).not.toBeNull();
    const decoded = decodeURIComponent(utf8Match?.[1] ?? '');
    expect(decoded).toBe('Фактура_0000000016.pdf');

    expect(headers['Content-Type']).toBe('application/pdf');
    expect(getSentBuffer()).not.toBeNull();
  });

  it('stamps a draft render with the ЧЕРНОВА watermark', async () => {
    const document = await seedDocument(db.prisma, {
      accountId,
      status: 'DRAFT',
      number: null,
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    // The watermark is letter-spaced, so pdf.js emits each glyph as its own text item.
    const text = (await extractPdfText(buffer)).replace(/\s+/g, '');
    expect(text).toContain('ЧЕРНОВА');
    expect(text).toContain('БЕЗПРАВНАСИЛА');
  });

  it('leaves an issued render unwatermarked', async () => {
    const document = await seedDocument(db.prisma, { accountId, number: 19 });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = (await extractPdfText(buffer)).replace(/\s+/g, '');
    expect(text).not.toContain('БЕЗПРАВНАСИЛА');
  });

  it('never offers a draft as an attachment, even when download is requested', async () => {
    const document = await seedDocument(db.prisma, {
      accountId,
      status: 'DRAFT',
      number: null,
    });
    const { res, headers } = createMockResponse();
    await controller.render(document.id, accountId, res);

    expect(headers['Content-Disposition']).toContain('inline;');
    expect(headers['Content-Disposition']).not.toContain('attachment');
  });

  it('serves the PDF inline when the viewer asks for disposition=inline', async () => {
    const document = await seedDocument(db.prisma, { accountId, number: 17 });
    const { res, headers } = createMockResponse();
    await controller.render(document.id, accountId, res, 'inline');

    const disposition = headers['Content-Disposition'] ?? '';
    expect(disposition).toContain('inline;');
    expect(disposition).not.toContain('attachment');
    expect(/filename="[\x20-\x7E]+"/.test(disposition)).toBe(true);
    expect(decodeURIComponent(/filename\*=UTF-8''([^;]+)/.exec(disposition)?.[1] ?? '')).toBe(
      'Фактура_0000000017.pdf',
    );
  });

  it('falls back to attachment for an unrecognised disposition value', async () => {
    const document = await seedDocument(db.prisma, { accountId, number: 18 });
    const { res, headers } = createMockResponse();
    await controller.render(document.id, accountId, res, 'nonsense');

    expect(headers['Content-Disposition']).toContain('attachment;');
  });

  it('a draft with no number renders with Чернова in the filename', async () => {
    const document = await seedDocument(db.prisma, {
      accountId,
      status: 'DRAFT',
      number: null,
    });
    const { filename } = await service.renderPdf(document.id, accountId);
    expect(filename).toBe('Фактура_Чернова.pdf');
  });
});
