import type { ExecutionContext } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { AdminGuard, type AdminRequest } from './admin.guard';

function createContext(request: AdminRequest): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let guard: AdminGuard;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    guard = new AdminGuard(prisma as unknown as PrismaService);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('rejects a user with role "user" with FORBIDDEN', async () => {
    const account = await prisma.account.create({ data: {} });
    const user = await prisma.user.create({
      data: {
        id: 'user-role-user',
        name: 'Plain User',
        email: 'plain@example.com',
        accountId: account.id,
      },
    });

    const request = { userId: user.id } as unknown as AdminRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
  });

  it('allows a user with role "admin"', async () => {
    const account = await prisma.account.create({ data: {} });
    const user = await prisma.user.create({
      data: {
        id: 'user-role-admin',
        name: 'Admin User',
        email: 'admin@example.com',
        accountId: account.id,
        role: 'admin',
      },
    });

    const request = { userId: user.id } as unknown as AdminRequest;

    const allowed = await guard.canActivate(createContext(request));

    expect(allowed).toBe(true);
    expect(request.adminUser?.id).toBe(user.id);
  });

  it('rejects an unauthenticated request with UNAUTHORIZED', async () => {
    const request = {} as unknown as AdminRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
