import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAuth } from '../auth/auth.config';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';

const AUTH_OPTIONS = {
  secret: 'test-secret-at-least-32-characters-long',
  baseURL: 'http://localhost:3001',
  trustedOrigins: ['http://localhost:3000'],
};

describe('signup can never set role', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it('a fresh user always gets role "user", regardless of what signup sends', async () => {
    const auth = createAuth(db.prisma, AUTH_OPTIONS);

    const options = {
      body: {
        name: 'Ivan Ivanov',
        email: 'role-test@example.com',
        password: 'correct-horse-battery',
        role: 'admin',
      },
    } as Parameters<typeof auth.api.signUpEmail>[0];
    const result = await auth.api.signUpEmail(options);

    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    expect(user.role).toBe('user');
  });
});
