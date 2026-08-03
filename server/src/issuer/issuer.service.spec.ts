import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { IssuerService } from './issuer.service';

describe('IssuerService', () => {
  let db: TestDatabase;
  let service: IssuerService;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new IssuerService(db.prisma as unknown as PrismaService);
  });

  afterAll(async () => {
    await db.stop();
  });

  it('returns an empty profile for a fresh account', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const profile = await service.getProfile(account.id);
    expect(profile.companyName).toBeNull();
    expect(profile.vatRegistered).toBe(false);
  });

  it('round-trips a full update', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const updated = await service.updateProfile(account.id, {
      companyName: 'Test EOOD',
      eik: '123456789',
      addressLine: 'ul. Test 1',
      city: 'Sofia',
      vatRegistered: true,
      vatNumber: 'BG123456789',
    });
    expect(updated.companyName).toBe('Test EOOD');
    expect(updated.vatRegistered).toBe(true);

    const fetched = await service.getProfile(account.id);
    expect(fetched).toEqual(updated);
  });

  it('accepts a partial save without clobbering other fields', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await service.updateProfile(account.id, { companyName: 'Partial EOOD', city: 'Plovdiv' });
    const partial = await service.updateProfile(account.id, { phone: '+359888000000' });

    expect(partial.companyName).toBe('Partial EOOD');
    expect(partial.city).toBe('Plovdiv');
    expect(partial.phone).toBe('+359888000000');
  });
});
