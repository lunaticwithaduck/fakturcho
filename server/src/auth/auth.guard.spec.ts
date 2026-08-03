import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { createAuth } from './auth.config';
import { type AuthenticatedRequest, AuthGuard } from './auth.guard';

const AUTH_OPTIONS = {
  secret: 'test-secret-at-least-32-characters-long',
  baseURL: 'http://localhost:3001',
};

function createContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function extractCookieHeader(headers: Headers): string {
  return headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0] ?? '')
    .join('; ');
}

describe('AuthGuard', () => {
  let db: TestDatabase;
  let auth: ReturnType<typeof createAuth>;
  let guard: AuthGuard;

  beforeAll(async () => {
    db = await startTestDatabase();
    auth = createAuth(db.prisma, AUTH_OPTIONS);
    guard = new AuthGuard(new Reflector(), auth);
  });

  afterAll(async () => {
    await db.stop();
  });

  it('sets accountId on the request for a valid session', async () => {
    const { headers, response } = await auth.api.signUpEmail({
      body: {
        name: 'Guard User',
        email: 'guard-user@example.com',
        password: 'correct-horse-battery',
      },
      returnHeaders: true,
    });
    const cookie = extractCookieHeader(headers);

    const request = { headers: { cookie } } as unknown as AuthenticatedRequest;
    const context = createContext(request);

    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
    expect(request.accountId).toBe(response.user.accountId);
    expect(request.userId).toBe(response.user.id);
  });

  it('rejects a request with no session', async () => {
    const request = { headers: {} } as unknown as AuthenticatedRequest;
    const context = createContext(request);

    await expect(guard.canActivate(context)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
