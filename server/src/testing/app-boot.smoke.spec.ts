import { describe, expect, it } from 'vitest';
import { startTestDatabase } from './test-database';

describe('application bootstrap', () => {
  it('resolves the full dependency graph and rejects unauthenticated requests', async () => {
    const db = await startTestDatabase();
    process.env.DATABASE_URL = db.url;
    process.env.BETTER_AUTH_SECRET = 'test-secret';
    process.env.BETTER_AUTH_URL = 'http://localhost:3999';
    process.env.REVOLUT_API_KEY = 'sk_test';
    process.env.REVOLUT_PUBLIC_KEY = 'pk_test';
    process.env.REVOLUT_ENVIRONMENT = 'sandbox';
    process.env.REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID = 'plan_var_test';
    process.env.REVOLUT_WEBHOOK_SECRET = 'wsk_test';
    process.env.RESEND_API_KEY = 're_test';
    process.env.EMAIL_FROM = 'test@example.com';
    const { AppModule } = await import('../app.module');
    const { NestFactory } = await import('@nestjs/core');
    const app = await NestFactory.create(AppModule, { rawBody: true, logger: false });
    await app.listen(0);
    const address = app.getHttpServer().address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    const response = await fetch(`http://127.0.0.1:${port}/api/clients`);
    expect(response.status).toBe(401);
    await app.close();
    await db.stop();
  });
});
