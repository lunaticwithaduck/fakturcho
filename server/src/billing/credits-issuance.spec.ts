import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocumentIssuanceService } from '../documents/document-issuance.service';
import { DocumentsService } from '../documents/documents.service';
import { createCompleteIssuerProfile, draftRequest } from '../documents/test-support';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { NumberingService } from '../numbering/numbering.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { CreditsService } from './credits.service';

describe('credits at issuance', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let documentsService: DocumentsService;
  let issuanceService: DocumentIssuanceService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    const prismaService = prisma as unknown as PrismaService;
    documentsService = new DocumentsService(prismaService);
    issuanceService = new DocumentIssuanceService(
      prismaService,
      new NumberingService(prismaService),
      new CreditsService(prismaService),
    );
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  async function createFundedAccount(balanceCents: number): Promise<string> {
    const account = await prisma.account.create({ data: { creditBalanceCents: balanceCents } });
    if (balanceCents > 0) {
      await prisma.creditLedgerEntry.create({
        data: { accountId: account.id, amountCents: balanceCents, reason: 'ADJUSTMENT' },
      });
    }
    await createCompleteIssuerProfile(prisma, account.id);
    return account.id;
  }

  it('invariant 20: a 10-cent balance funds exactly one issuance; the next is rejected with INSUFFICIENT_CREDITS, claims no number and stays draft', async () => {
    const accountId = await createFundedAccount(10);

    const first = await documentsService.saveDraft(accountId, null, draftRequest());
    const issued = await issuanceService.issue(accountId, first.id, {});
    expect(issued.number).toBe(1);
    expect(issued.status).toBe('sent');

    const afterFirst = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    expect(afterFirst.creditBalanceCents).toBe(0);

    const second = await documentsService.saveDraft(accountId, null, draftRequest());
    await expect(issuanceService.issue(accountId, second.id, {})).rejects.toMatchObject({
      code: 'INSUFFICIENT_CREDITS',
      status: 402,
    });

    const stillDraft = await documentsService.get(accountId, second.id);
    expect(stillDraft.status).toBe('draft');
    expect(stillDraft.number).toBeNull();

    const series = await prisma.numberSeries.findUniqueOrThrow({
      where: { accountId_documentType: { accountId, documentType: 'INVOICE' } },
    });
    expect(series.nextNumber).toBe(2n);
    expect(series.issuedCount).toBe(1);

    const afterSecond = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    expect(afterSecond.creditBalanceCents).toBe(0);
  });

  it('invariant 21: two concurrent issuances on a 10-cent account — exactly one succeeds, the balance never goes negative and matches the ledger', async () => {
    const accountId = await createFundedAccount(10);

    const drafts = await Promise.all([
      documentsService.saveDraft(accountId, null, draftRequest()),
      documentsService.saveDraft(accountId, null, draftRequest()),
    ]);

    const outcomes = await Promise.allSettled(
      drafts.map((draft) => issuanceService.issue(accountId, draft.id, {})),
    );

    const fulfilled = outcomes.filter((outcome) => outcome.status === 'fulfilled');
    const rejected = outcomes.filter(
      (outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected',
    );
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatchObject({ code: 'INSUFFICIENT_CREDITS' });

    const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    expect(account.creditBalanceCents).toBe(0);

    const ledger = await prisma.creditLedgerEntry.findMany({ where: { accountId } });
    const ledgerSum = ledger.reduce((sum, entry) => sum + entry.amountCents, 0);
    expect(ledgerSum).toBe(account.creditBalanceCents);
    expect(ledger.filter((entry) => entry.reason === 'ISSUANCE')).toHaveLength(1);

    const issuedCount = await prisma.document.count({
      where: { accountId, status: 'SENT' },
    });
    expect(issuedCount).toBe(1);
  });

  it('invariant 23: a usable subscription issues with no deduction and no ledger entry; a lapsed one falls back to credits', async () => {
    const accountId = await createFundedAccount(20);
    await prisma.subscription.create({ data: { accountId, status: 'ACTIVE' } });

    const first = await documentsService.saveDraft(accountId, null, draftRequest());
    const issuedFree = await issuanceService.issue(accountId, first.id, {});
    expect(issuedFree.status).toBe('sent');

    const afterSubscribed = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    expect(afterSubscribed.creditBalanceCents).toBe(20);
    const freeEntries = await prisma.creditLedgerEntry.count({
      where: { accountId, reason: 'ISSUANCE' },
    });
    expect(freeEntries).toBe(0);

    await prisma.subscription.update({ where: { accountId }, data: { status: 'CANCELED' } });

    const second = await documentsService.saveDraft(accountId, null, draftRequest());
    await issuanceService.issue(accountId, second.id, {});

    const afterLapse = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    expect(afterLapse.creditBalanceCents).toBe(10);
    const spendEntries = await prisma.creditLedgerEntry.findMany({
      where: { accountId, reason: 'ISSUANCE' },
    });
    expect(spendEntries).toHaveLength(1);
    expect(spendEntries[0]?.amountCents).toBe(-10);
    expect(spendEntries[0]?.documentId).toBe(second.id);
  });
});
