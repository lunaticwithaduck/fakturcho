import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import type { TestDatabase } from '../testing/test-database';
import { startTestDatabase } from '../testing/test-database';
import { setDocumentKsefNumber } from './set-ksef-number';
import { createAccount } from './test-support';

// CRC-8 checksum computed per CIRFMF/ksef-docs (faktury/numer-ksef.md).
const VALID_KSEF_NUMBER = '1234563218-20260905-0102030405AB-7A';
// Same NIP/hex, dated 2026-09-10 (before VALID_KSEF_NUMBER's document issue
// date below) and 2099-12-31 (always in the future).
const KSEF_NUMBER_DATED_BEFORE_ISSUE = '1234563218-20260910-0102030405AB-B7';
const KSEF_NUMBER_DATED_IN_FUTURE = '1234563218-20991231-0102030405AB-79';

async function createIssuedPlDocument(
  prisma: PrismaClient,
  accountId: string,
  issuedAt: Date | null = null,
) {
  return prisma.document.create({
    data: {
      accountId,
      documentType: 'INVOICE',
      status: 'SENT',
      number: 1,
      issuerCountry: 'PL',
      issuedAt,
    },
  });
}

describe('setDocumentKsefNumber — format and checksum validation', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let prismaService: PrismaService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    prismaService = prisma as unknown as PrismaService;
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('accepts a KSeF number with a correct CRC-8 checksum', async () => {
    const accountId = await createAccount(prisma);
    const document = await createIssuedPlDocument(prisma, accountId);

    const result = await setDocumentKsefNumber(
      prismaService,
      accountId,
      document.id,
      VALID_KSEF_NUMBER,
    );
    expect(result.ksefNumber).toBe(VALID_KSEF_NUMBER);
  });

  it('rejects a KSeF number with the wrong checksum', async () => {
    const accountId = await createAccount(prisma);
    const document = await createIssuedPlDocument(prisma, accountId);

    await expect(
      setDocumentKsefNumber(
        prismaService,
        accountId,
        document.id,
        '1234563218-20260905-0102030405AB-00',
      ),
    ).rejects.toMatchObject({ code: 'INVALID_KSEF_NUMBER' });
  });

  it('rejects a malformed KSeF number', async () => {
    const accountId = await createAccount(prisma);
    const document = await createIssuedPlDocument(prisma, accountId);

    await expect(
      setDocumentKsefNumber(prismaService, accountId, document.id, 'not-a-ksef-number'),
    ).rejects.toMatchObject({ code: 'INVALID_KSEF_NUMBER' });
  });

  it('still allows clearing the KSeF number with null', async () => {
    const accountId = await createAccount(prisma);
    const document = await createIssuedPlDocument(prisma, accountId);

    const result = await setDocumentKsefNumber(prismaService, accountId, document.id, null);
    expect(result.ksefNumber).toBeNull();
  });
});

describe('setDocumentKsefNumber — date-segment validation', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let prismaService: PrismaService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    prismaService = prisma as unknown as PrismaService;
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('accepts a KSeF number dated on the invoice issue date', async () => {
    const accountId = await createAccount(prisma);
    const document = await createIssuedPlDocument(prisma, accountId, new Date('2026-09-05'));

    const result = await setDocumentKsefNumber(
      prismaService,
      accountId,
      document.id,
      VALID_KSEF_NUMBER,
    );
    expect(result.ksefNumber).toBe(VALID_KSEF_NUMBER);
  });

  it('rejects a KSeF number dated before the invoice issue date', async () => {
    const accountId = await createAccount(prisma);
    const document = await createIssuedPlDocument(prisma, accountId, new Date('2026-09-20'));

    await expect(
      setDocumentKsefNumber(prismaService, accountId, document.id, KSEF_NUMBER_DATED_BEFORE_ISSUE),
    ).rejects.toMatchObject({ code: 'INVALID_KSEF_NUMBER' });
  });

  it('rejects a KSeF number dated in the future', async () => {
    const accountId = await createAccount(prisma);
    const document = await createIssuedPlDocument(prisma, accountId, new Date('2026-09-05'));

    await expect(
      setDocumentKsefNumber(prismaService, accountId, document.id, KSEF_NUMBER_DATED_IN_FUTURE),
    ).rejects.toMatchObject({ code: 'INVALID_KSEF_NUMBER' });
  });
});
