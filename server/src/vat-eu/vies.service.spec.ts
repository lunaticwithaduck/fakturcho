import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ViesHttpClient } from './vies.service';
import { ViesService } from './vies.service';

function fakeClient(impl: ViesHttpClient['checkVatNumber']): ViesHttpClient {
  return { checkVatNumber: vi.fn(impl) };
}

describe('ViesService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses a successful response', async () => {
    const client = fakeClient(async () => ({ valid: true }));
    const service = new ViesService(client);
    const result = await service.checkVatNumber('DE', '123456788');
    expect(result).toEqual({ valid: true });
  });

  it('caches a successful lookup and does not re-request within the TTL', async () => {
    const client = fakeClient(async () => ({ valid: true }));
    const service = new ViesService(client);
    await service.checkVatNumber('DE', '123456788');
    vi.setSystemTime(new Date('2026-09-09T12:00:00.000Z'));
    const result = await service.checkVatNumber('DE', '123456788');
    expect(result).toEqual({ valid: true });
    expect(client.checkVatNumber).toHaveBeenCalledOnce();
  });

  it('re-requests once the cache entry is older than the TTL', async () => {
    const client = fakeClient(async () => ({ valid: true }));
    const service = new ViesService(client);
    await service.checkVatNumber('DE', '123456788');
    vi.setSystemTime(new Date('2026-09-10T00:00:01.000Z'));
    await service.checkVatNumber('DE', '123456788');
    expect(client.checkVatNumber).toHaveBeenCalledTimes(2);
  });

  it('fails soft to unverified when the client throws', async () => {
    const client = fakeClient(async () => {
      throw new Error('network down');
    });
    const service = new ViesService(client);
    const result = await service.checkVatNumber('DE', '123456788');
    expect(result).toEqual({ valid: 'unverified' });
  });

  it('fails soft to unverified when the client returns null', async () => {
    const client = fakeClient(async () => null);
    const service = new ViesService(client);
    const result = await service.checkVatNumber('DE', '123456788');
    expect(result).toEqual({ valid: 'unverified' });
  });

  it('keys the cache by country code and VAT number', async () => {
    const client = fakeClient(async (countryCode) => ({ valid: countryCode === 'DE' }));
    const service = new ViesService(client);
    const de = await service.checkVatNumber('DE', '123456788');
    const bg = await service.checkVatNumber('BG', '123456788');
    expect(de).toEqual({ valid: true });
    expect(bg).toEqual({ valid: false });
    expect(client.checkVatNumber).toHaveBeenCalledTimes(2);
  });
});
