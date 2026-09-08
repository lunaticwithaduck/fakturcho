import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { AdminCreditsService } from './admin-credits.service';
import { type AdminSeed, seedAdminFixtures } from './admin-test-support';
import { monthKey } from './month-range';

describe('admin credit sales report', () => {
  let db: TestDatabase;
  let service: AdminCreditsService;
  let seed: AdminSeed;
  const now = new Date();
  const currentMonth = monthKey(now);
  const lastMonth = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

  beforeAll(async () => {
    db = await startTestDatabase();
    const prismaService = db.prisma as unknown as PrismaService;
    service = new AdminCreditsService(prismaService);
    seed = await seedAdminFixtures(db.prisma as unknown as PrismaClient);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('summary totals only PURCHASE entries', async () => {
    const summary = await service.summary();
    expect(summary).toEqual({
      soldAllTimeCents: 6500,
      soldThisMonthCents: 5000,
      purchasesAllTime: 3,
      purchasesThisMonth: 2,
    });
  });

  it('months are zero-filled with the seeded months populated', async () => {
    const months = await service.months();
    expect(months).toHaveLength(12);
    expect(months.find((row) => row.month === currentMonth)).toEqual({
      month: currentMonth,
      soldCents: 5000,
      purchases: 2,
    });
    expect(months.find((row) => row.month === lastMonth)).toEqual({
      month: lastMonth,
      soldCents: 1500,
      purchases: 1,
    });
    for (const row of months) {
      if (row.month === currentMonth || row.month === lastMonth) continue;
      expect(row.soldCents).toBe(0);
      expect(row.purchases).toBe(0);
    }
  });

  it('purchases lists only PURCHASE entries with account names', async () => {
    const rows = await service.purchases();
    expect(rows).toHaveLength(3);

    const alfaRows = rows.filter((row) => row.accountId === seed.accountAId);
    const betaRows = rows.filter((row) => row.accountId === seed.accountBId);
    expect(alfaRows).toHaveLength(2);
    expect(betaRows).toHaveLength(1);
    expect(alfaRows.map((row) => row.amountCents).sort()).toEqual([2000, 3000]);
    expect(betaRows[0]).toMatchObject({
      accountName: 'Бета ООД',
      amountCents: 1500,
      revolutOrderId: 'admin-test-order-3',
    });
  });
});
