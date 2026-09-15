import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController#update — country falls back to the stored client', () => {
  let db: TestDatabase;
  let controller: ClientsController;

  beforeAll(async () => {
    db = await startTestDatabase();
    controller = new ClientsController(new ClientsService(db.prisma as unknown as PrismaService));
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('validates a later countyRegion-only update against the country stored on the client', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const client = await controller.create(account.id, {
      companyName: 'Cliente SRL',
      country: 'IT',
    });

    await expect(
      controller.update(account.id, client.id, { countyRegion: 'Milano' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    const updated = await controller.update(account.id, client.id, { countyRegion: 'MI' });
    expect(updated.countyRegion).toBe('MI');
    expect(updated.country).toBe('IT');
  });

  it('applies the pattern for a newly-changed country in the same update', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const client = await controller.create(account.id, {
      companyName: 'Cliente SRL',
      country: 'RO',
    });

    await expect(
      controller.update(account.id, client.id, { country: 'IT', countyRegion: 'Roma' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    const updated = await controller.update(account.id, client.id, {
      country: 'IT',
      countyRegion: 'RM',
    });
    expect(updated.country).toBe('IT');
    expect(updated.countyRegion).toBe('RM');
  });
});
