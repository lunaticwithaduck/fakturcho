import { SIGNUP_GRANT_CENTS } from '@fakturcho/shared-types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
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
    expect(user.locale).toBe('bg');

    const account = await db.prisma.account.findUnique({ where: { id: accountId } });
    expect(account).not.toBeNull();

    const issuerProfile = await db.prisma.issuerProfile.findUnique({ where: { accountId } });
    expect(issuerProfile).not.toBeNull();
    expect(issuerProfile?.companyName).toBeNull();
    expect(issuerProfile?.vatRegistered).toBe(false);

    const subscription = await db.prisma.subscription.findUnique({ where: { accountId } });
    expect(subscription).toBeNull();

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

  it('derives locale from a non-BG country at signup', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'Hans Muller',
        email: 'hans@example.com',
        password: 'correct-horse-battery',
        country: 'DE',
      },
    });

    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    expect(user.locale).toBe('de');
  });

  it('ignores a client-supplied locale and derives it from country instead', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'Spoofed User',
        email: 'spoofed@example.com',
        password: 'correct-horse-battery',
        country: 'DE',
        locale: 'bg',
      },
    });

    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    expect(user.locale).toBe('de');
  });

  it('rejects an unsupported locale value with no country, falling back to bg', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'Garbage Locale User',
        email: 'garbage-locale@example.com',
        password: 'correct-horse-battery',
        locale: 'xx',
      },
    });

    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    expect(user.locale).toBe('bg');
  });

  it('accepts an explicit supported locale with no country', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'Explicit En User',
        email: 'explicit-en@example.com',
        password: 'correct-horse-battery',
        locale: 'en',
      },
    });

    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    expect(user.locale).toBe('en');
  });

  it('defaults to bg when no country is provided, unchanged from before', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'No Country User',
        email: 'no-country@example.com',
        password: 'correct-horse-battery',
      },
    });

    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    expect(user.locale).toBe('bg');
  });

  it('provisions the issuer profile with the signup country', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'Country Profile User',
        email: 'country-profile@example.com',
        password: 'correct-horse-battery',
        country: 'DE',
      },
    });

    const accountId = result.user.accountId;
    const issuerProfile = await db.prisma.issuerProfile.findUnique({ where: { accountId } });
    expect(issuerProfile?.country).toBe('DE');
  });

  it('provisions the issuer profile with the default country when none is given', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'No Country Profile User',
        email: 'no-country-profile@example.com',
        password: 'correct-horse-battery',
      },
    });

    const accountId = result.user.accountId;
    const issuerProfile = await db.prisma.issuerProfile.findUnique({ where: { accountId } });
    expect(issuerProfile?.country).toBe('BG');
  });

  it('EN_LOCALE off: still stores the country, but derives locale bg', async () => {
    const flags = new FeatureFlagsService(db.prisma as unknown as PrismaService);
    await flags.setEnabled('EN_LOCALE', false);
    const auth = createAuth(db.prisma, AUTH_OPTIONS, flags);

    const result = await auth.api.signUpEmail({
      body: {
        name: 'Off Flag User',
        email: 'off-flag@example.com',
        password: 'correct-horse-battery',
        country: 'DE',
      },
    });

    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    expect(user.country).toBe('DE');
    expect(user.locale).toBe('bg');

    await flags.setEnabled('EN_LOCALE', true);
  });
});
