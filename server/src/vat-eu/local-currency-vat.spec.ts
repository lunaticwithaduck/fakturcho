import { describe, expect, it } from 'vitest';
import { ExchangeRateService } from './exchange-rate.service';
import type { LocalCurrencyVatInput } from './local-currency-vat';
import { resolveLocalCurrencyVatSnapshot } from './local-currency-vat';

function serviceWithRate(rate: string, rateDate: string, table: string | null = null) {
  return new ExchangeRateService({
    NBP: { fetchRateOn: async () => ({ rate, rateDate, table }) },
    BNR: { fetchRateOn: async () => ({ rate, rateDate, table }) },
    ECB: { fetchRateOn: async () => ({ rate, rateDate, table }) },
  });
}

function baseInput(overrides: Partial<LocalCurrencyVatInput> = {}): LocalCurrencyVatInput {
  return {
    documentType: 'invoice',
    issuerCountry: 'PL',
    currency: 'EUR',
    vatAmount: 123456,
    taxEventAt: new Date('2026-09-17T00:00:00.000Z'),
    issuedAt: new Date('2026-09-17T00:00:00.000Z'),
    ...overrides,
  };
}

describe('resolveLocalCurrencyVatSnapshot', () => {
  it('returns null for a euro-area issuer', async () => {
    const result = await resolveLocalCurrencyVatSnapshot(
      baseInput({ issuerCountry: 'DE' }),
      serviceWithRate('4.2512', '2026-09-16'),
    );
    expect(result).toBeNull();
  });

  it('returns null for a non-tax document type', async () => {
    const result = await resolveLocalCurrencyVatSnapshot(
      baseInput({ documentType: 'proforma' }),
      serviceWithRate('4.2512', '2026-09-16'),
    );
    expect(result).toBeNull();
  });

  it('returns null when there is no VAT to convert', async () => {
    const result = await resolveLocalCurrencyVatSnapshot(
      baseInput({ vatAmount: 0 }),
      serviceWithRate('4.2512', '2026-09-16'),
    );
    expect(result).toBeNull();
  });

  it('returns null when no issuer country is known', async () => {
    const result = await resolveLocalCurrencyVatSnapshot(
      baseInput({ issuerCountry: null }),
      serviceWithRate('4.2512', '2026-09-16'),
    );
    expect(result).toBeNull();
  });

  it('PL: asks NBP for the day before the tax point and snapshots the rate', async () => {
    let requestedDate = '';
    const service = new ExchangeRateService({
      NBP: {
        fetchRateOn: async (currency, isoDate) => {
          requestedDate = isoDate;
          return currency === 'PLN'
            ? { rate: '4.2512', rateDate: isoDate, table: '181/A/NBP/2026' }
            : null;
        },
      },
      BNR: { fetchRateOn: async () => null },
      ECB: { fetchRateOn: async () => null },
    });
    const result = await resolveLocalCurrencyVatSnapshot(baseInput(), service);
    expect(requestedDate).toBe('2026-09-16');
    expect(result).toEqual({
      localCurrency: 'PLN',
      exchangeRate: '4.2512',
      exchangeRateDate: new Date('2026-09-16T00:00:00.000Z'),
      exchangeRateSource: 'NBP',
      exchangeRateTable: '181/A/NBP/2026',
      vatAmountLocal: Math.round(123456 * 4.2512),
    });
  });

  it('RO: asks BNR for the tax point date itself (not the day before)', async () => {
    let requestedDate = '';
    const service = new ExchangeRateService({
      NBP: { fetchRateOn: async () => null },
      BNR: {
        fetchRateOn: async (currency, isoDate) => {
          requestedDate = isoDate;
          return currency === 'RON' ? { rate: '4.9771', rateDate: isoDate, table: null } : null;
        },
      },
      ECB: { fetchRateOn: async () => null },
    });
    const result = await resolveLocalCurrencyVatSnapshot(
      baseInput({ issuerCountry: 'RO' }),
      service,
    );
    expect(requestedDate).toBe('2026-09-17');
    expect(result?.exchangeRateSource).toBe('BNR');
    expect(result?.localCurrency).toBe('RON');
  });

  it('falls back to issuedAt when taxEventAt is null', async () => {
    let requestedDate = '';
    const service = new ExchangeRateService({
      NBP: {
        fetchRateOn: async (_currency, isoDate) => {
          requestedDate = isoDate;
          return { rate: '4.2512', rateDate: isoDate, table: null };
        },
      },
      BNR: { fetchRateOn: async () => null },
      ECB: { fetchRateOn: async () => null },
    });
    await resolveLocalCurrencyVatSnapshot(
      baseInput({ taxEventAt: null, issuedAt: new Date('2026-09-20T00:00:00.000Z') }),
      service,
    );
    expect(requestedDate).toBe('2026-09-19');
  });

  it('CZ/DK/HU/SE use ECB as the rate source', async () => {
    const service = new ExchangeRateService({
      NBP: { fetchRateOn: async () => null },
      BNR: { fetchRateOn: async () => null },
      ECB: {
        fetchRateOn: async (_currency, isoDate) => ({
          rate: '25.30',
          rateDate: isoDate,
          table: null,
        }),
      },
    });
    const result = await resolveLocalCurrencyVatSnapshot(
      baseInput({ issuerCountry: 'CZ' }),
      service,
    );
    expect(result?.exchangeRateSource).toBe('ECB');
    expect(result?.localCurrency).toBe('CZK');
  });

  it('throws EXCHANGE_RATE_UNAVAILABLE when no rate can be found', async () => {
    const service = new ExchangeRateService({
      NBP: { fetchRateOn: async () => null },
      BNR: { fetchRateOn: async () => null },
      ECB: { fetchRateOn: async () => null },
    });
    await expect(resolveLocalCurrencyVatSnapshot(baseInput(), service)).rejects.toMatchObject({
      code: 'EXCHANGE_RATE_UNAVAILABLE',
    });
  });

  it('throws EXCHANGE_RATE_UNAVAILABLE when the provider throws (network failure)', async () => {
    const service = new ExchangeRateService({
      NBP: {
        fetchRateOn: async () => {
          throw new Error('network down');
        },
      },
      BNR: { fetchRateOn: async () => null },
      ECB: { fetchRateOn: async () => null },
    });
    await expect(resolveLocalCurrencyVatSnapshot(baseInput(), service)).rejects.toMatchObject({
      code: 'EXCHANGE_RATE_UNAVAILABLE',
    });
  });
});
