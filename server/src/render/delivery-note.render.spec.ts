import { extractText, getDocumentProxy } from 'unpdf';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { RenderService } from './render.service';
import { seedDocument } from './testing/seed-document';

async function extractPdfText(buffer: Buffer): Promise<string> {
  const doc = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(doc, { mergePages: true });
  return text;
}

describe('delivery_note rendering', () => {
  let db: TestDatabase;
  let service: RenderService;
  let accountId: string;
  let seq = 0;

  beforeAll(async () => {
    db = await startTestDatabase();
    const flags = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    await flags.setEnabled('EN_LOCALE', true);
    service = new RenderService(db.prisma as unknown as PrismaService, flags);
    await service.onModuleInit();
    const account = await db.prisma.account.create({ data: {} });
    accountId = account.id;
  }, 180_000);

  afterAll(async () => {
    await service.onModuleDestroy();
    await db.stop();
  });

  const cases: Array<{ language: string; issuerCountry: string; label: string }> = [
    { language: 'bg', issuerCountry: 'BG', label: 'Стокова разписка' },
    { language: 'en', issuerCountry: 'IE', label: 'Delivery note' },
    { language: 'de', issuerCountry: 'DE', label: 'Lieferschein' },
    { language: 'fr', issuerCountry: 'FR', label: 'Bon de livraison' },
    { language: 'it', issuerCountry: 'IT', label: 'Documento di trasporto (DDT)' },
    { language: 'pl', issuerCountry: 'PL', label: 'Dowód dostawy' },
    { language: 'ro', issuerCountry: 'RO', label: 'Aviz de însoțire a mărfii' },
  ];

  for (const { language, issuerCountry, label } of cases) {
    it(`renders the ${language} delivery-note label and carries no VAT or exemption line`, async () => {
      seq += 1;
      const document = await seedDocument(db.prisma, {
        accountId,
        documentType: 'DELIVERY_NOTE',
        number: seq,
        overrides: {
          documentLanguage: language,
          issuerCountry,
          vatRateBp: 0,
          vatAmount: 0,
          vatExemptionGround: null,
        },
      });
      const { buffer } = await service.renderPdf(document.id, accountId);
      const text = await extractPdfText(buffer);
      expect(text).toContain(label);
      expect(text).not.toContain('Основание за неначисляване');
      expect(text).not.toContain('%):');
    });
  }

  it('never carries the (Оригинал)/(Original) tax-document marker after the number', async () => {
    seq += 1;
    const document = await seedDocument(db.prisma, {
      accountId,
      documentType: 'DELIVERY_NOTE',
      number: seq,
      overrides: { vatRateBp: 0, vatAmount: 0, vatExemptionGround: null },
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).not.toContain('Оригинал');
    expect(text).not.toContain('Original');
  });

  it('BG: shows the delivery date and the price/total columns, prices are shown by BG practice', async () => {
    seq += 1;
    const document = await seedDocument(db.prisma, {
      accountId,
      documentType: 'DELIVERY_NOTE',
      number: seq,
      overrides: {
        deliveryDate: new Date('2026-09-15'),
        vatRateBp: 0,
        vatAmount: 0,
        vatExemptionGround: null,
      },
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).toContain('Дата на доставка');
    expect(text).toContain('Ед. цена без ДДС');
    expect(text).toContain('Обща стойност:');
    expect(text).not.toContain('Данъчно събитие');
  });

  it('IT: causale, carrier and transport date/time print, and prices/totals are hidden (DDT never shows value)', async () => {
    seq += 1;
    const document = await seedDocument(db.prisma, {
      accountId,
      documentType: 'DELIVERY_NOTE',
      number: seq,
      overrides: {
        documentLanguage: 'it',
        issuerCountry: 'IT',
        transportReason: 'Vendita',
        // Rome runs CEST (UTC+2) in September, so 07:30 UTC is 09:30 local.
        transportedAt: new Date('2026-09-15T07:30:00.000Z'),
        carrierName: 'Bartolini SpA',
        transportNote: '3 colli, 12 kg',
        vatRateBp: 0,
        vatAmount: 0,
      },
    });
    const { buffer } = await service.renderPdf(document.id, accountId);
    const text = await extractPdfText(buffer);
    expect(text).toContain('Causale del trasporto: Vendita');
    expect(text).toContain('Vettore: Bartolini SpA');
    expect(text).toContain('Dati del trasporto: 3 colli, 12 kg');
    expect(text).toContain('Data e ora di inizio del trasporto: 15/09/2026, 09:30');
    expect(text).not.toContain('Prezzo');
    expect(text).not.toContain('Totale:');
  });
});
