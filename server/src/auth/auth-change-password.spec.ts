import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { createAuth } from './auth.config';

const AUTH_OPTIONS = {
  secret: 'test-secret-at-least-32-characters-long',
  baseURL: 'http://localhost:3001',
  trustedOrigins: ['http://localhost:3000'],
};

function cookieHeaderFrom(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

async function signUpAndSignIn(
  auth: ReturnType<typeof createAuth>,
  email: string,
  password: string,
) {
  await auth.api.signUpEmail({ body: { name: 'Test User', email, password } });
  const response = (await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  })) as Response;
  return cookieHeaderFrom(response);
}

describe('change-password', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it('changes the password when the current password is correct', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);
    const cookie = await signUpAndSignIn(auth, 'change-ok@example.com', 'correct-horse-battery');

    await auth.api.changePassword({
      body: { currentPassword: 'correct-horse-battery', newPassword: 'new-horse-battery' },
      headers: { cookie },
    });

    await expect(
      auth.api.signInEmail({
        body: { email: 'change-ok@example.com', password: 'correct-horse-battery' },
      }),
    ).rejects.toMatchObject({ status: 'UNAUTHORIZED' });

    const signedInWithNewPassword = await auth.api.signInEmail({
      body: { email: 'change-ok@example.com', password: 'new-horse-battery' },
    });
    expect(signedInWithNewPassword.user.email).toBe('change-ok@example.com');
  });

  it('rejects the wrong current password and leaves the old one active', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);
    const cookie = await signUpAndSignIn(auth, 'change-wrong@example.com', 'correct-horse-battery');

    await expect(
      auth.api.changePassword({
        body: { currentPassword: 'not-the-password', newPassword: 'new-horse-battery' },
        headers: { cookie },
      }),
    ).rejects.toMatchObject({ status: 'BAD_REQUEST', body: { code: 'INVALID_PASSWORD' } });

    const stillSignedIn = await auth.api.signInEmail({
      body: { email: 'change-wrong@example.com', password: 'correct-horse-battery' },
    });
    expect(stillSignedIn.user.email).toBe('change-wrong@example.com');
  });

  it('rejects a new password shorter than the configured minimum', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);
    const cookie = await signUpAndSignIn(auth, 'change-short@example.com', 'correct-horse-battery');

    await expect(
      auth.api.changePassword({
        body: { currentPassword: 'correct-horse-battery', newPassword: 'short' },
        headers: { cookie },
      }),
    ).rejects.toMatchObject({ status: 'BAD_REQUEST', body: { code: 'PASSWORD_TOO_SHORT' } });
  });

  it('revokes other sessions when revokeOtherSessions is true', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);
    const email = 'change-revoke@example.com';
    const password = 'correct-horse-battery';
    await auth.api.signUpEmail({ body: { name: 'Test User', email, password } });

    const firstSessionResponse = (await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })) as Response;
    const firstCookie = cookieHeaderFrom(firstSessionResponse);

    const secondSessionResponse = (await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })) as Response;
    const secondCookie = cookieHeaderFrom(secondSessionResponse);

    await auth.api.changePassword({
      body: {
        currentPassword: password,
        newPassword: 'new-horse-battery',
        revokeOtherSessions: true,
      },
      headers: { cookie: firstCookie },
    });

    const revokedSession = await auth.api.getSession({ headers: { cookie: secondCookie } });
    expect(revokedSession).toBeNull();
  });
});
