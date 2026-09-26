import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreditsService } from '../billing/credits.service';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { NumberingService } from '../numbering/numbering.service';
import type { TestDatabase } from '../testing/test-database';
import { startTestDatabase } from '../testing/test-database';
import { ExchangeRateService } from '../vat-eu/exchange-rate.service';
import { DocumentIssuanceService } from './document-issuance.service';
import { DocumentsService } from './documents.service';
import { createAccount, createCompleteIssuerProfile, draftRequest } from './test-support';

function issuanceServiceWithRate(
  prismaService: PrismaService,
  rate: string | null,
  rateDate = '2026-09-16',
) {
  const stub = rate ? async () => ({ rate, rateDate, table: '181/A/NBP/2026' }) : async () => null;
  const exchangeRateService = new ExchangeRateService({
    NBP: { fetchRateOn: stub },
    BNR: { fetchRateOn: stub },
    ECB: { fetchRateOn: stub },
  });
  return new DocumentIssuanceService(
    prismaService,
    new NumberingService(prismaService),
    new CreditsService(prismaService),
    exchangeRateService,
  );
}

function issuanceServiceWithRates(
  prismaService: PrismaService,
  rates: readonly [string, string][],
) {
  let call = 0;
  const stub = async () => {
    const [rate, rateDate] = rates[Math.min(call, rates.length - 1)] as [string, string];
    call += 1;
    return { rate, rateDate, table: null };
  };
  const exchangeRateService = new ExchangeRateService({
    NBP: { fetchRateOn: stub },
    BNR: { fetchRateOn: stub },
    ECB: { fetchRateOn: stub },
  });
  return new DocumentIssuanceService(
    prismaService,
    new NumberingService(prismaService),
    new CreditsService(prismaService),
    exchangeRateService,
  );
}

describe('DocumentIssuanceService: VAT amount in national currency (art. 230)', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let documentsService: DocumentsService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    documentsService = new DocumentsService(prisma as unknown as PrismaService);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('snapshots the NBP rate and local VAT amount on a PL invoice at issuance', async () => {
    const prismaService = prisma as unknown as PrismaService;
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, 'Jan Kowalski', {
      country: 'PL',
      street: 'ul. Testowa 1',
      postcode: '00-001',
      vatRegistered: true,
      vatNumber: 'PL1234567890',
    });
    const draft = await documentsService.saveDraft(accountId, null, draftRequest());
    const issuanceService = issuanceServiceWithRate(prismaService, '4.2512');

    const issued = await issuanceService.issue(accountId, draft.id, {});

    expect(issued.localCurrency).toBe('PLN');
    expect(issued.exchangeRate).toBe('4.2512');
    expect(issued.exchangeRateSource).toBe('NBP');
    expect(issued.exchangeRateTable).toBe('181/A/NBP/2026');
    expect(issued.vatAmountLocal).toBe(Math.round((issued.vatAmount as number) * 4.2512));
  }, 30_000);

  it('leaves the snapshot null for a euro-area issuer', async () => {
    const prismaService = prisma as unknown as PrismaService;
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, 'Иван Иванов', {
      country: 'BG',
      vatRegistered: true,
      vatNumber: 'BG123456789',
    });
    const draft = await documentsService.saveDraft(accountId, null, draftRequest());
    const issuanceService = issuanceServiceWithRate(prismaService, '4.2512');

    const issued = await issuanceService.issue(accountId, draft.id, {});

    expect(issued.localCurrency).toBeNull();
    expect(issued.vatAmountLocal).toBeNull();
  }, 30_000);

  it('fails issuance with EXCHANGE_RATE_UNAVAILABLE and claims no number when the rate cannot be fetched', async () => {
    const prismaService = prisma as unknown as PrismaService;
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, 'Jan Kowalski', {
      country: 'PL',
      street: 'ul. Testowa 1',
      postcode: '00-001',
      vatRegistered: true,
      vatNumber: 'PL1234567890',
    });
    const draft = await documentsService.saveDraft(accountId, null, draftRequest());
    const issuanceService = issuanceServiceWithRate(prismaService, null);

    await expect(issuanceService.issue(accountId, draft.id, {})).rejects.toMatchObject({
      code: 'EXCHANGE_RATE_UNAVAILABLE',
    });

    const stillDraft = await prisma.document.findUnique({ where: { id: draft.id } });
    expect(stillDraft?.status).toBe('DRAFT');
    expect(stillDraft?.number).toBeNull();
  }, 30_000);

  it('splits the PL local VAT per rate when the invoice has more than one charged rate', async () => {
    const prismaService = prisma as unknown as PrismaService;
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, 'Jan Kowalski', {
      country: 'PL',
      street: 'ul. Testowa 1',
      postcode: '00-001',
      vatRegistered: true,
      vatNumber: 'PL1234567890',
    });
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        lineItems: [
          { name: 'A', quantity: '1', unitPrice: 60000, sortOrder: 0, vatRateBp: 2300 },
          { name: 'B', quantity: '1', unitPrice: 27000, sortOrder: 1, vatRateBp: 800 },
        ],
      }),
    );
    const issuanceService = issuanceServiceWithRate(prismaService, '4.2512');

    await issuanceService.issue(accountId, draft.id, {});
    const record = await prisma.document.findUnique({ where: { id: draft.id } });

    expect(record?.vatAmountLocalByRate).toEqual([
      { rateBp: 2300, vatAmountLocal: Math.round(13800 * 4.2512) },
      { rateBp: 800, vatAmountLocal: Math.round(2160 * 4.2512) },
    ]);
  }, 30_000);

  it('a RO credit note reuses the original invoice exchange rate instead of fetching a fresh one', async () => {
    const prismaService = prisma as unknown as PrismaService;
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, 'Ion Popescu', {
      country: 'RO',
      street: 'Str. Test 1',
      postcode: '010101',
      countyRegion: 'București',
      vatRegistered: true,
      vatNumber: 'RO12345678',
    });
    const invoiceDraft = await documentsService.saveDraft(accountId, null, draftRequest());
    const invoiceIssuance = issuanceServiceWithRates(prismaService, [['4.9771', '2026-09-16']]);
    const invoice = await invoiceIssuance.issue(accountId, invoiceDraft.id, {});

    const creditNoteDraft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        documentType: 'credit_note',
        originalDocumentId: invoice.id,
        correctionReason: 'Test correction',
      }),
    );
    // A different rate is available for the correction's own (later) date —
    // it must be ignored in favour of the original invoice's snapshot rate.
    const creditNoteIssuance = issuanceServiceWithRates(prismaService, [['5.1000', '2026-10-01']]);
    const creditNote = await creditNoteIssuance.issue(accountId, creditNoteDraft.id, {});

    expect(creditNote.exchangeRate).toBe(invoice.exchangeRate);
    expect(creditNote.exchangeRateDate).toBe(invoice.exchangeRateDate);
    expect(creditNote.vatAmountLocal).toBe(
      Math.round((creditNote.vatAmount as number) * Number(invoice.exchangeRate)),
    );
  }, 30_000);
});
