import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import type { TestDatabase } from '../testing/test-database';
import { startTestDatabase } from '../testing/test-database';
import { NumberingService } from './numbering.service';

describe('NumberingService', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let service: NumberingService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    service = new NumberingService(prisma as unknown as PrismaService);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  async function createAccount(): Promise<string> {
    const account = await prisma.account.create({ data: {} });
    return account.id;
  }

  it('invariant 2: concurrent claims on the same series serialize into consecutive numbers, never duplicated', async () => {
    const accountId = await createAccount();
    const concurrency = 20;

    const results = await Promise.all(
      Array.from({ length: concurrency }, () =>
        prisma.$transaction((tx) => service.claimNumber(tx, accountId, 'invoice'), {
          timeout: 20_000,
          maxWait: 20_000,
        }),
      ),
    );

    const numbers = results.map((value) => Number(value)).sort((a, b) => a - b);
    expect(new Set(numbers).size).toBe(concurrency);
    expect(numbers).toEqual(Array.from({ length: concurrency }, (_, index) => index + 1));
  });

  it('invariant 3: an override is honoured with zero issued documents, then locked once any exist', async () => {
    const accountId = await createAccount();

    const first = await prisma.$transaction((tx) =>
      service.claimNumber(tx, accountId, 'invoice', 500),
    );
    expect(first).toBe(500n);

    const second = await prisma.$transaction((tx) => service.claimNumber(tx, accountId, 'invoice'));
    expect(second).toBe(501n);

    await expect(
      prisma.$transaction((tx) => service.claimNumber(tx, accountId, 'invoice', 900)),
    ).rejects.toMatchObject({ code: 'SERIES_OVERRIDE_LOCKED' });

    await expect(
      prisma.$transaction((tx) => service.claimNumber(tx, accountId, 'invoice', 900)),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('rejects a colliding number with NUMBER_COLLISION before hitting the DB constraint', async () => {
    const accountId = await createAccount();
    await prisma.document.create({
      data: {
        accountId,
        documentType: 'INVOICE',
        status: 'SENT',
        number: 42n,
      },
    });

    await expect(
      prisma.$transaction((tx) => service.claimNumber(tx, accountId, 'invoice', 42)),
    ).rejects.toMatchObject({ code: 'NUMBER_COLLISION' });
  });

  it('reports series info per document type, including untouched series', async () => {
    const accountId = await createAccount();
    await prisma.$transaction((tx) => service.claimNumber(tx, accountId, 'invoice'));
    await prisma.$transaction((tx) => service.claimNumber(tx, accountId, 'invoice'));

    const info = await service.getSeriesInfo(accountId);
    const invoiceInfo = info.find((entry) => entry.documentType === 'invoice');
    const quoteInfo = info.find((entry) => entry.documentType === 'quote');

    expect(invoiceInfo).toEqual({
      documentType: 'invoice',
      previousNumber: 2,
      nextNumber: 3,
      overridable: false,
    });
    expect(quoteInfo).toEqual({
      documentType: 'quote',
      previousNumber: null,
      nextNumber: 1,
      overridable: true,
    });
  });
});
