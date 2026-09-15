import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsController', () => {
  let db: TestDatabase;
  let service: FeatureFlagsService;
  let controller: FeatureFlagsController;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    controller = new FeatureFlagsController(service);
  });

  afterAll(async () => {
    await db.stop();
  });

  it('returns all three flags, off by default', async () => {
    expect(await controller.getAll()).toEqual({
      EN_LOCALE: false,
      EINVOICE: false,
      PEPPOL: false,
    });
  });

  it('reflects an enabled flag', async () => {
    await db.prisma.featureFlag.update({ where: { key: 'EINVOICE' }, data: { enabled: true } });
    service.invalidate();
    expect(await controller.getAll()).toEqual({
      EN_LOCALE: false,
      EINVOICE: true,
      PEPPOL: false,
    });
  });
});
