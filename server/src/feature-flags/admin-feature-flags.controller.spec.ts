import type { ExecutionContext } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminGuard, type AdminRequest } from '../admin/admin.guard';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { AdminFeatureFlagsController } from './admin-feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

function createContext(request: AdminRequest): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AdminFeatureFlagsController', () => {
  let db: TestDatabase;
  let controller: AdminFeatureFlagsController;
  let guard: AdminGuard;

  beforeAll(async () => {
    db = await startTestDatabase();
    controller = new AdminFeatureFlagsController(
      new FeatureFlagsService(db.prisma as unknown as PrismaService),
    );
    guard = new AdminGuard(db.prisma as unknown as PrismaService);
  });

  afterAll(async () => {
    await db.stop();
  });

  it('lists all three flags with their updatedAt timestamps', async () => {
    const rows = await controller.list();
    expect(rows.map((row) => row.key).sort()).toEqual(['EINVOICE', 'EN_LOCALE', 'PEPPOL']);
    expect(rows.every((row) => row.enabled === false)).toBe(true);
  });

  it('flips a flag on', async () => {
    const updated = await controller.update('PEPPOL', { enabled: true });
    expect(updated).toMatchObject({ key: 'PEPPOL', enabled: true });

    const rows = await controller.list();
    expect(rows.find((row) => row.key === 'PEPPOL')?.enabled).toBe(true);
  });

  it('rejects an unknown flag key', async () => {
    await expect(async () =>
      controller.update('NOT_A_FLAG', { enabled: true }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('rejects a body without a boolean enabled field', async () => {
    await expect(async () =>
      controller.update('EINVOICE', { enabled: 'yes' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('rejects a non-admin request with FORBIDDEN, the same AdminGuard as every other admin route', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const user = await db.prisma.user.create({
      data: {
        id: 'feature-flags-plain-user',
        name: 'Plain User',
        email: 'plain-feature-flags@example.com',
        accountId: account.id,
      },
    });

    await expect(
      guard.canActivate(createContext({ userId: user.id } as unknown as AdminRequest)),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });
});
