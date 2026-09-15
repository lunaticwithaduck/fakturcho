import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { MeController } from './me.controller';

describe('MeController', () => {
  let db: TestDatabase;
  let flags: FeatureFlagsService;
  let controller: MeController;
  let userId: string;

  beforeAll(async () => {
    db = await startTestDatabase();
    flags = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    controller = new MeController(db.prisma as unknown as PrismaService, flags);

    const account = await db.prisma.account.create({ data: {} });
    const user = await db.prisma.user.create({
      data: {
        id: 'me-controller-test-user',
        name: 'Hans Muller',
        email: 'hans-me@example.com',
        accountId: account.id,
        locale: 'en',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await db.stop();
  });

  it('reports the stored locale when EN_LOCALE is on', async () => {
    await db.prisma.featureFlag.update({ where: { key: 'EN_LOCALE' }, data: { enabled: true } });
    flags.invalidate();

    const me = await controller.me(userId);
    expect(me.locale).toBe('en');
  });

  it('forces bg when EN_LOCALE is off, regardless of the stored locale', async () => {
    await db.prisma.featureFlag.update({ where: { key: 'EN_LOCALE' }, data: { enabled: false } });
    flags.invalidate();

    const me = await controller.me(userId);
    expect(me.locale).toBe('bg');
  });
});
