import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let db: TestDatabase;
  let service: ClientsService;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new ClientsService(db.prisma as unknown as PrismaService);
  });

  afterAll(async () => {
    await db.stop();
  });

  it('rejects a duplicate EIK within the same account', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await service.create(account.id, { companyName: 'Alpha Ltd', eik: '123456789' });

    await expect(
      service.create(account.id, { companyName: 'Beta Ltd', eik: '123456789' }),
    ).rejects.toThrow(DomainError);
    await expect(
      service.create(account.id, { companyName: 'Beta Ltd', eik: '123456789' }),
    ).rejects.toMatchObject({ code: 'CLIENT_EIK_DUPLICATE' });
  });

  it('allows the same EIK across different accounts', async () => {
    const accountA = await db.prisma.account.create({ data: {} });
    const accountB = await db.prisma.account.create({ data: {} });
    await service.create(accountA.id, { companyName: 'Gamma Ltd', eik: '999888777' });
    const client = await service.create(accountB.id, {
      companyName: 'Delta Ltd',
      eik: '999888777',
    });
    expect(client.eik).toBe('999888777');
  });

  it('allows two clients with no EIK in the same account', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const first = await service.create(account.id, { companyName: 'No EIK One' });
    const second = await service.create(account.id, { companyName: 'No EIK Two' });
    expect(first.eik).toBeNull();
    expect(second.eik).toBeNull();
  });

  it('rejects a duplicate EIK on update too', async () => {
    const account = await db.prisma.account.create({ data: {} });
    await service.create(account.id, { companyName: 'Existing', eik: '111222333' });
    const other = await service.create(account.id, { companyName: 'Other' });

    await expect(service.update(account.id, other.id, { eik: '111222333' })).rejects.toMatchObject({
      code: 'CLIENT_EIK_DUPLICATE',
    });
  });

  it('lets a client keep its own EIK on update', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const client = await service.create(account.id, { companyName: 'Self', eik: '444555666' });

    const updated = await service.update(account.id, client.id, {
      companyName: 'Self Renamed',
      eik: '444555666',
    });
    expect(updated.companyName).toBe('Self Renamed');
    expect(updated.eik).toBe('444555666');
  });
});
