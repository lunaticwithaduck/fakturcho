import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { FeatureFlagsService } from './feature-flags.service';

function fakePrisma(rows: Array<{ key: string; enabled: boolean }>) {
  const findMany = vi.fn().mockResolvedValue(rows);
  return { prisma: { featureFlag: { findMany } } as unknown as PrismaService, findMany };
}

describe('FeatureFlagsService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serves reads from cache within the TTL, without hitting the database again', async () => {
    const { prisma, findMany } = fakePrisma([{ key: 'EINVOICE', enabled: false }]);
    const service = new FeatureFlagsService(prisma);

    await service.getAll();
    await service.getAll();

    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('re-reads the database once the TTL has elapsed', async () => {
    const { prisma, findMany } = fakePrisma([{ key: 'PEPPOL', enabled: false }]);
    const service = new FeatureFlagsService(prisma);

    await service.getAll();
    vi.advanceTimersByTime(6_000);
    await service.getAll();

    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('invalidate() forces the next read to hit the database, even within the TTL', async () => {
    const { prisma, findMany } = fakePrisma([{ key: 'PEPPOL', enabled: false }]);
    const service = new FeatureFlagsService(prisma);

    await service.getAll();
    service.invalidate();
    await service.getAll();

    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('missing rows default to false for every known key', async () => {
    const { prisma } = fakePrisma([]);
    const service = new FeatureFlagsService(prisma);

    expect(await service.getAll()).toEqual({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });
  });
});

describe('FeatureFlagsService against a real database', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it('seeds the three known flags, all off', async () => {
    const service = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    expect(await service.getAll()).toEqual({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });
  });

  it('reflects a row written directly after the cache is invalidated', async () => {
    const service = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    await service.getAll();
    await db.prisma.featureFlag.update({ where: { key: 'EINVOICE' }, data: { enabled: true } });
    service.invalidate();
    expect(await service.isEnabled('EINVOICE')).toBe(true);

    await db.prisma.featureFlag.update({ where: { key: 'EINVOICE' }, data: { enabled: false } });
  });

  it('setEnabled invalidates the cache immediately, in the same process', async () => {
    const service = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    await service.getAll();

    await service.setEnabled('PEPPOL', true);

    expect(await service.isEnabled('PEPPOL')).toBe(true);
    await service.setEnabled('PEPPOL', false);
  });

  it('list returns every flag with its updatedAt timestamp', async () => {
    const service = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    const rows = await service.list();
    expect(rows.map((row) => row.key)).toEqual(['EINVOICE', 'EN_LOCALE', 'PEPPOL']);
    expect(rows.every((row) => typeof row.updatedAt === 'string')).toBe(true);
  });
});
