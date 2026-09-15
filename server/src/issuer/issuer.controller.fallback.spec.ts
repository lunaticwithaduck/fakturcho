import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { IssuerController } from './issuer.controller';
import { IssuerService } from './issuer.service';

describe('IssuerController#updateProfile — country falls back to the stored profile', () => {
  let db: TestDatabase;
  let controller: IssuerController;

  beforeAll(async () => {
    db = await startTestDatabase();
    controller = new IssuerController(new IssuerService(db.prisma as unknown as PrismaService));
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('validates a later countyRegion-only update against the country stored on a previous update', async () => {
    const account = await db.prisma.account.create({ data: {} });

    await controller.updateProfile(account.id, { country: 'IT' });

    await expect(
      controller.updateProfile(account.id, { countyRegion: 'Milano' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' } as Partial<DomainError>);

    const updated = await controller.updateProfile(account.id, { countyRegion: 'MI' });
    expect(updated.countyRegion).toBe('MI');
    expect(updated.country).toBe('IT');
  });

  it('validates identifiers on a country-less update against the stored country', async () => {
    const account = await db.prisma.account.create({ data: {} });

    await controller.updateProfile(account.id, { country: 'FR' });

    await expect(
      controller.updateProfile(account.id, { identifiers: { siret: '12' } }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' } as Partial<DomainError>);

    const updated = await controller.updateProfile(account.id, {
      identifiers: { siret: '73282932000074' },
    });
    expect(updated.identifiers.siret).toBe('73282932000074');
  });
});
