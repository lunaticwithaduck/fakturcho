import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { CreditsService } from './credits.service';

describe('CreditsService', () => {
  let db: TestDatabase;
  let service: CreditsService;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new CreditsService(db.prisma as unknown as PrismaService);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('getBalance reports cents and whole documents remaining', async () => {
    const account = await db.prisma.account.create({ data: { creditBalanceCents: 105 } });

    expect(await service.getBalance(account.id)).toEqual({
      balanceCents: 105,
      documentsRemaining: 10,
    });
  });

  it('getBalance rejects an unknown account with NOT_FOUND', async () => {
    await expect(service.getBalance('acc_missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('getLedger maps reasons to the DTO union, newest first, capped at 50', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const base = Date.parse('2026-01-01T00:00:00.000Z');
    await db.prisma.creditLedgerEntry.createMany({
      data: Array.from({ length: 52 }, (_, index) => ({
        id: `clg_${account.id}_${index}`,
        accountId: account.id,
        amountCents: index === 0 ? 100 : -10,
        reason: index === 0 ? ('SIGNUP_GRANT' as const) : ('ISSUANCE' as const),
        createdAt: new Date(base + index * 60_000),
      })),
    });

    const ledger = await service.getLedger(account.id);
    expect(ledger).toHaveLength(50);
    expect(ledger[0]).toMatchObject({
      id: `clg_${account.id}_51`,
      amountCents: -10,
      reason: 'issuance',
      documentId: null,
    });
    expect(ledger[49]?.id).toBe(`clg_${account.id}_2`);
    expect(ledger.every((entry) => entry.reason === 'issuance')).toBe(true);
    expect(typeof ledger[0]?.createdAt).toBe('string');
  });

  it('getLedger returns purchase and signup_grant reasons in DTO form', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await db.prisma.creditLedgerEntry.create({
      data: {
        accountId: account.id,
        amountCents: 100,
        reason: 'SIGNUP_GRANT',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    });
    await db.prisma.creditLedgerEntry.create({
      data: {
        accountId: account.id,
        amountCents: 500,
        reason: 'PURCHASE',
        wiseTransactionId: `txn_${account.id}`,
        createdAt: new Date('2026-02-02T00:00:00.000Z'),
      },
    });

    const ledger = await service.getLedger(account.id);
    expect(ledger.map((entry) => entry.reason)).toEqual(['purchase', 'signup_grant']);
  });
});
