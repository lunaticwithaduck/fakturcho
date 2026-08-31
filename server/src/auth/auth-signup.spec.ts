import { SIGNUP_GRANT_CENTS } from '@fakturcho/shared-types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { createAuth } from './auth.config';

const AUTH_OPTIONS = {
  secret: 'test-secret-at-least-32-characters-long',
  baseURL: 'http://localhost:3001',
  trustedOrigins: ['http://localhost:3000'],
};

describe('signup provisions a tenant', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it('creates user + account + empty issuer profile + signup credit grant, all linked', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'Ivan Ivanov',
        email: 'ivan@example.com',
        password: 'correct-horse-battery',
      },
    });

    const accountId = result.user.accountId;
    expect(accountId).toBeTruthy();

    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    expect(user.accountId).toBe(accountId);

    const account = await db.prisma.account.findUnique({ where: { id: accountId } });
    expect(account).not.toBeNull();

    const issuerProfile = await db.prisma.issuerProfile.findUnique({ where: { accountId } });
    expect(issuerProfile).not.toBeNull();
    expect(issuerProfile?.companyName).toBeNull();
    expect(issuerProfile?.vatRegistered).toBe(false);

    expect(account?.creditBalanceCents).toBe(SIGNUP_GRANT_CENTS);
    const ledger = await db.prisma.creditLedgerEntry.findMany({ where: { accountId } });
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      amountCents: SIGNUP_GRANT_CENTS,
      reason: 'SIGNUP_GRANT',
      documentId: null,
    });
  });

  it('provisions a distinct account per signup', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const first = await auth.api.signUpEmail({
      body: { name: 'User A', email: 'user-a@example.com', password: 'correct-horse-battery' },
    });
    const second = await auth.api.signUpEmail({
      body: { name: 'User B', email: 'user-b@example.com', password: 'correct-horse-battery' },
    });

    expect(first.user.accountId).not.toBe(second.user.accountId);
  });
});
