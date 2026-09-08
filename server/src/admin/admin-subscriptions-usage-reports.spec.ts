import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { AdminReportsService } from './admin-reports.service';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { type AdminSeed, seedAdminFixtures } from './admin-test-support';
import { AdminUsageService } from './admin-usage.service';
import { monthKey } from './month-range';

describe('subscriptions, usage and reports', () => {
  let db: TestDatabase;
  let subscriptionsService: AdminSubscriptionsService;
  let usageService: AdminUsageService;
  let reportsService: AdminReportsService;
  let seed: AdminSeed;
  const currentMonth = monthKey(new Date());

  beforeAll(async () => {
    db = await startTestDatabase();
    const prismaService = db.prisma as unknown as PrismaService;
    subscriptionsService = new AdminSubscriptionsService(prismaService);
    usageService = new AdminUsageService(prismaService);
    reportsService = new AdminReportsService(prismaService);
    seed = await seedAdminFixtures(db.prisma as unknown as PrismaClient);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('subscriptions summary counts by status', async () => {
    const summary = await subscriptionsService.summary();
    expect(summary).toMatchObject({
      mrrCents: 500,
      activeCount: 1,
      trialingCount: 0,
      pastDueCount: 0,
      canceledCount: 0,
    });
  });

  it('subscriptions list returns the seeded subscription', async () => {
    const rows = await subscriptionsService.list('all');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      accountId: seed.accountAId,
      accountName: 'Алфа ЕООД',
      status: 'active',
      planName: 'business',
      mrrCents: 500,
    });
  });

  it('usage current month totals match the seed', async () => {
    const months = await usageService.months();
    expect(months).toHaveLength(12);
    const current = months.find((row) => row.month === currentMonth);
    expect(current).toMatchObject({ documentsIssued: 3, activeAccounts: 2, emailsSent: 1 });
  });

  it('turnover report totals per account for the current month', async () => {
    const rows = await reportsService.turnover(currentMonth);
    const alfa = rows.find((row) => row.accountId === seed.accountAId);
    const beta = rows.find((row) => row.accountId === seed.accountBId);

    expect(alfa).toMatchObject({
      accountName: 'Алфа ЕООД',
      documentsIssued: 2,
      turnoverCents: 12_000,
    });
    expect(beta).toMatchObject({
      accountName: 'Бета ООД',
      documentsIssued: 1,
      turnoverCents: 3_000,
    });
  });

  it('reports months returns 12 calendar months ending with the current one', () => {
    const months = reportsService.months();
    expect(months).toHaveLength(12);
    expect(months[0]).toBe(currentMonth);
  });
});
