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
});
