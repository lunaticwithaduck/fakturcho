import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { EmailSender, SendEmailInput } from '../email/ports';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { createAuth } from './auth.config';

const AUTH_OPTIONS = {
  secret: 'test-secret-at-least-32-characters-long',
  baseURL: 'http://localhost:3001',
  trustedOrigins: ['http://localhost:3000'],
};

function fakeSender(): { sender: EmailSender; sent: SendEmailInput[] } {
  const sent: SendEmailInput[] = [];
  return {
    sender: {
      send: async (input) => {
        sent.push(input);
      },
    },
    sent,
  };
}

function tokenFromEmail(input: SendEmailInput): string {
  const match = input.text.match(/token=(\S+)/);
  if (!match?.[1]) throw new Error('reset email did not contain a token link');
  return match[1];
}

describe('reset-password', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("sends one email with a link and a token, in the user's locale", async () => {
    const { sender, sent } = fakeSender();
    const auth = createAuth(db.prisma, AUTH_OPTIONS, undefined, sender);
    await auth.api.signUpEmail({
      body: {
        name: 'Hans Muller',
        email: 'reset-de@example.com',
        password: 'correct-horse-battery',
        locale: 'de',
      },
    });

    await auth.api.requestPasswordReset({ body: { email: 'reset-de@example.com' } });

    expect(sent).toHaveLength(1);
    expect(sent[0]?.subject).toBe('Setzen Sie Ihr Fakturcho-Passwort zurück');
    expect(sent[0]?.text).toContain('http://localhost:3000/de/reset-password?token=');
    expect(tokenFromEmail(sent[0] as SendEmailInput).length).toBeGreaterThan(0);
  });

  it('does not send an email and returns the same response for an unknown email', async () => {
    const { sender, sent } = fakeSender();
    const auth = createAuth(db.prisma, AUTH_OPTIONS, undefined, sender);

    const known = await auth.api.requestPasswordReset({
      body: { email: 'no-such-user@example.com' },
    });

    expect(sent).toHaveLength(0);
    expect(known.status).toBe(true);
  });

  it('resets the password with a valid token, invalidates the old one and revokes other sessions', async () => {
    const { sender, sent } = fakeSender();
    const auth = createAuth(db.prisma, AUTH_OPTIONS, undefined, sender);
    const email = 'reset-ok@example.com';
    const password = 'correct-horse-battery';
    await auth.api.signUpEmail({ body: { name: 'Test User', email, password } });

    const otherSessionResponse = (await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })) as Response;
    const otherCookie = otherSessionResponse.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; ');

    await auth.api.requestPasswordReset({ body: { email } });
    const token = tokenFromEmail(sent[0] as SendEmailInput);

    await auth.api.resetPassword({ body: { newPassword: 'new-horse-battery', token } });

    await expect(auth.api.signInEmail({ body: { email, password } })).rejects.toMatchObject({
      status: 'UNAUTHORIZED',
    });

    const signedInWithNewPassword = await auth.api.signInEmail({
      body: { email, password: 'new-horse-battery' },
    });
    expect(signedInWithNewPassword.user.email).toBe(email);

    const revokedSession = await auth.api.getSession({ headers: { cookie: otherCookie } });
    expect(revokedSession).toBeNull();
  });

  it('rejects a token that was never issued', async () => {
    const { sender } = fakeSender();
    const auth = createAuth(db.prisma, AUTH_OPTIONS, undefined, sender);

    await expect(
      auth.api.resetPassword({ body: { newPassword: 'new-horse-battery', token: 'bogus-token' } }),
    ).rejects.toMatchObject({ status: 'BAD_REQUEST', body: { code: 'INVALID_TOKEN' } });
  });
});
