import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { AdminAccountsService } from './admin-accounts.service';
import { type AdminSeed, seedAdminFixtures } from './admin-test-support';

describe('AdminAccountsService', () => {
  let db: TestDatabase;
  let service: AdminAccountsService;
  let seed: AdminSeed;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new AdminAccountsService(db.prisma as unknown as PrismaService);
    seed = await seedAdminFixtures(db.prisma as unknown as PrismaClient);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('lists both accounts with computed fields', async () => {
    const rows = await service.list({ search: '', status: 'all' });
    const alfa = rows.find((row) => row.id === seed.accountAId);
    const beta = rows.find((row) => row.id === seed.accountBId);

    expect(alfa).toMatchObject({
      companyName: 'Алфа ЕООД',
      city: 'Пловдив',
      vatRegistered: false,
      documentsIssued: 2,
      subscriptionStatus: 'active',
    });
    expect(beta).toMatchObject({
      companyName: 'Бета ООД',
      city: 'Варна',
      documentsIssued: 1,
      subscriptionStatus: 'none',
    });
  });

  it('search filters by company name', async () => {
    const rows = await service.list({ search: 'Алфа', status: 'all' });
    expect(rows.map((row) => row.id)).toEqual([seed.accountAId]);
  });

  it('status filter distinguishes "none" from real statuses', async () => {
    const active = await service.list({ search: '', status: 'active' });
    expect(active.map((row) => row.id)).toEqual([seed.accountAId]);

    const none = await service.list({ search: '', status: 'none' });
    expect(none.map((row) => row.id)).toEqual([seed.accountBId]);
  });

  it('detail returns issuer, subscription and credit fields', async () => {
    const detail = await service.detail(seed.accountAId);
    expect(detail).toMatchObject({
      companyName: 'Алфа ЕООД',
      iban: 'BG00ALFA0000000000',
      bic: 'ALFABGSF',
      email: 'user-a@alfa.bg',
      planName: 'business',
      mrrCents: 0,
      creditBalanceCents: 999_980,
    });
    expect(detail.currentPeriodEnd).not.toBeNull();
  });
});
