import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { RequireFeatureFlag } from './feature-flag.decorator';
import { FeatureFlagGuard } from './feature-flag.guard';
import { FeatureFlagsService } from './feature-flags.service';

class DummyController {
  @RequireFeatureFlag('EINVOICE')
  gated() {}

  ungated() {}
}

function createContext(handler: () => void): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => DummyController,
    switchToHttp: () => ({ getRequest: () => ({}) }),
  } as unknown as ExecutionContext;
}

describe('FeatureFlagGuard', () => {
  let db: TestDatabase;
  let flags: FeatureFlagsService;
  let guard: FeatureFlagGuard;

  beforeAll(async () => {
    db = await startTestDatabase();
    flags = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    guard = new FeatureFlagGuard(new Reflector(), flags);
  });

  afterAll(async () => {
    await db.stop();
  });

  it('lets an unguarded route through without consulting any flag', async () => {
    const controller = new DummyController();
    expect(await guard.canActivate(createContext(controller.ungated))).toBe(true);
  });

  it('rejects a gated route with NOT_FOUND while its flag is off', async () => {
    const controller = new DummyController();
    await expect(guard.canActivate(createContext(controller.gated))).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('allows a gated route once its flag is on', async () => {
    await db.prisma.featureFlag.update({ where: { key: 'EINVOICE' }, data: { enabled: true } });
    flags.invalidate();

    const controller = new DummyController();
    expect(await guard.canActivate(createContext(controller.gated))).toBe(true);
  });
});
