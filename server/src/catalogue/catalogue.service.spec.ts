import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { CatalogueService } from './catalogue.service';

describe('CatalogueService', () => {
  let db: TestDatabase;
  let service: CatalogueService;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new CatalogueService(db.prisma as unknown as PrismaService);
  });

  afterAll(async () => {
    await db.stop();
  });

  it('creates, lists, updates and deletes a catalogue item', async () => {
    const account = await db.prisma.account.create({ data: {} });

    const created = await service.create(account.id, {
      name: 'Consulting hour',
      defaultUnitPrice: 12000,
      unit: 'hour',
    });
    expect(created.defaultUnitPrice).toBe(12000);

    const list = await service.list(account.id);
    expect(list).toHaveLength(1);

    const updated = await service.update(account.id, created.id, { defaultUnitPrice: 15000 });
    expect(updated.defaultUnitPrice).toBe(15000);
    expect(updated.name).toBe('Consulting hour');

    await service.remove(account.id, created.id);
    const afterDelete = await service.list(account.id);
    expect(afterDelete).toHaveLength(0);
  });

  it('scopes items by account', async () => {
    const accountA = await db.prisma.account.create({ data: {} });
    const accountB = await db.prisma.account.create({ data: {} });
    const item = await service.create(accountA.id, {
      name: 'A item',
      defaultUnitPrice: 100,
      unit: 'pc',
    });

    await expect(service.findOne(accountB.id, item.id)).rejects.toThrow();
  });
});
