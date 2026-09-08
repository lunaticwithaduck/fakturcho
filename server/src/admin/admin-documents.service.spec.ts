import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { AdminDocumentsService } from './admin-documents.service';
import { type AdminSeed, seedAdminFixtures } from './admin-test-support';

describe('AdminDocumentsService', () => {
  let db: TestDatabase;
  let service: AdminDocumentsService;
  let seed: AdminSeed;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new AdminDocumentsService(db.prisma as unknown as PrismaService);
    seed = await seedAdminFixtures(db.prisma as unknown as PrismaClient);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('lists every document across accounts, drafts included', async () => {
    const rows = await service.list({ search: '', documentType: 'all', status: 'all' });
    expect(rows.filter((row) => row.accountId === seed.accountAId)).toHaveLength(3);
    expect(rows.filter((row) => row.accountId === seed.accountBId)).toHaveLength(2);
  });

  it('status filter narrows to drafts', async () => {
    const rows = await service.list({ search: '', documentType: 'all', status: 'draft' });
    const seeded = rows.filter(
      (row) => row.accountId === seed.accountAId || row.accountId === seed.accountBId,
    );
    expect(seeded).toHaveLength(2);
    expect(rows.every((row) => row.status === 'draft')).toBe(true);
  });

  it('search matches the recipient snapshot', async () => {
    const rows = await service.list({ search: 'Клиент ООД', documentType: 'all', status: 'all' });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.recipientCompanyName).toBe('Клиент ООД');
    expect(rows[0]?.amount).toBe(5000);
  });
});
