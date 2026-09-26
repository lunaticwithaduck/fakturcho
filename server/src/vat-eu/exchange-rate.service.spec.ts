import { describe, expect, it, vi } from 'vitest';
import type { ExchangeRateHttpClient, ExchangeRateHttpClients } from './exchange-rate.service';
import { ExchangeRateService } from './exchange-rate.service';

function fakeClient(byDate: Record<string, { rate: string; table: string | null } | undefined>) {
  return {
    fetchRateOn: vi.fn(async (_currency: string, isoDate: string) => {
      const entry = byDate[isoDate];
      return entry ? { rate: entry.rate, rateDate: isoDate, table: entry.table } : null;
    }),
  } satisfies ExchangeRateHttpClient;
}

function clientsWith(nbp: ExchangeRateHttpClient): ExchangeRateHttpClients {
  return {
    NBP: nbp,
    BNR: fakeClient({}),
    ECB: fakeClient({}),
  };
}

describe('ExchangeRateService', () => {
  it('returns the rate published for the requested date', async () => {
    const nbp = fakeClient({ '2026-09-17': { rate: '4.2512', table: '181/A/NBP/2026' } });
    const service = new ExchangeRateService(clientsWith(nbp));
    const quote = await service.fetchRate({
      source: 'NBP',
      currency: 'PLN',
      onOrBeforeDate: '2026-09-17',
    });
    expect(quote).toEqual({ rate: '4.2512', rateDate: '2026-09-17', table: '181/A/NBP/2026' });
  });

  it('walks back over a weekend/holiday gap to the last published business day', async () => {
    // 2026-09-19 is a Saturday, 2026-09-20 a Sunday; NBP publishes Friday's rate.
    const nbp = fakeClient({ '2026-09-18': { rate: '4.2400', table: '180/A/NBP/2026' } });
    const service = new ExchangeRateService(clientsWith(nbp));
    const quote = await service.fetchRate({
      source: 'NBP',
      currency: 'PLN',
      onOrBeforeDate: '2026-09-20',
    });
    expect(quote).toEqual({ rate: '4.2400', rateDate: '2026-09-18', table: '180/A/NBP/2026' });
    expect(nbp.fetchRateOn).toHaveBeenCalledTimes(3);
  });

  it('caches a resolved date and does not re-request it', async () => {
    const nbp = fakeClient({ '2026-09-17': { rate: '4.2512', table: null } });
    const service = new ExchangeRateService(clientsWith(nbp));
    await service.fetchRate({ source: 'NBP', currency: 'PLN', onOrBeforeDate: '2026-09-17' });
    await service.fetchRate({ source: 'NBP', currency: 'PLN', onOrBeforeDate: '2026-09-17' });
    expect(nbp.fetchRateOn).toHaveBeenCalledTimes(1);
  });

  it('caches a no-data date so an overlapping walk-back does not re-request it', async () => {
    const nbp = fakeClient({ '2026-09-18': { rate: '4.2400', table: null } });
    const service = new ExchangeRateService(clientsWith(nbp));
    await service.fetchRate({ source: 'NBP', currency: 'PLN', onOrBeforeDate: '2026-09-19' });
    nbp.fetchRateOn.mockClear();
    await service.fetchRate({ source: 'NBP', currency: 'PLN', onOrBeforeDate: '2026-09-19' });
    expect(nbp.fetchRateOn).not.toHaveBeenCalled();
  });

  it('returns null once the walk-back window is exhausted', async () => {
    const nbp = fakeClient({});
    const service = new ExchangeRateService(clientsWith(nbp));
    const quote = await service.fetchRate({
      source: 'NBP',
      currency: 'PLN',
      onOrBeforeDate: '2026-09-20',
    });
    expect(quote).toBeNull();
  });

  it('propagates a hard fetch failure instead of walking further back', async () => {
    const nbp: ExchangeRateHttpClient = {
      fetchRateOn: vi.fn(async () => {
        throw new Error('network down');
      }),
    };
    const service = new ExchangeRateService(clientsWith(nbp));
    await expect(
      service.fetchRate({ source: 'NBP', currency: 'PLN', onOrBeforeDate: '2026-09-17' }),
    ).rejects.toThrow('network down');
    expect(nbp.fetchRateOn).toHaveBeenCalledTimes(1);
  });
});
