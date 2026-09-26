import { describe, expect, it } from 'vitest';
import { ExchangeRateService } from './exchange-rate.service';
import type { LocalCurrencyVatInput } from './local-currency-vat';
import {
  applyReusedLocalCurrencyRate,
  resolveLocalCurrencyVatSnapshot,
} from './local-currency-vat';

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
      vatAmountLocalByRate: null,
    });
  });

  it('PL: an invoice issued before the tax point uses the day before the issue date (art. 31a ust. 2)', async () => {
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
      baseInput({
        issuedAt: new Date('2026-09-17T00:00:00.000Z'),
        taxEventAt: new Date('2026-09-20T00:00:00.000Z'),
      }),
      service,
    );
    expect(requestedDate).toBe('2026-09-16');
  });

  it('RO: asks BNR for the business day before the tax point', async () => {
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
    expect(requestedDate).toBe('2026-09-16');
    expect(result?.exchangeRateSource).toBe('BNR');
    expect(result?.localCurrency).toBe('RON');
  });

  it('RO: an invoice issued before the supply uses the day before the issue date (art. 282 alin. (2) lit. a) CF)', async () => {
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
    await resolveLocalCurrencyVatSnapshot(
      baseInput({
        issuerCountry: 'RO',
        issuedAt: new Date('2026-09-17T00:00:00.000Z'),
        taxEventAt: new Date('2026-09-20T00:00:00.000Z'),
      }),
      service,
    );
    expect(requestedDate).toBe('2026-09-16');
  });

  it('RO: uses deliveryDate/taxEventAt when it is BEFORE the issue date (supply precedes invoicing)', async () => {
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
    await resolveLocalCurrencyVatSnapshot(
      baseInput({
        issuerCountry: 'RO',
        issuedAt: new Date('2026-09-20T00:00:00.000Z'),
        taxEventAt: new Date('2026-09-17T00:00:00.000Z'),
      }),
      service,
    );
    expect(requestedDate).toBe('2026-09-16');
  });

  it('prints the local VAT per rate once there is more than one charged rate', async () => {
    const service = serviceWithRate('4.2512', '2026-09-16');
    const result = await resolveLocalCurrencyVatSnapshot(
      baseInput({
        vatGroups: [
          { rateBp: 2300, vatAmount: 138 },
          { rateBp: 800, vatAmount: 216 },
        ],
      }),
      service,
    );
    expect(result?.vatAmountLocalByRate).toEqual([
      { rateBp: 2300, vatAmountLocal: Math.round(138 * 4.2512) },
      { rateBp: 800, vatAmountLocal: Math.round(216 * 4.2512) },
    ]);
  });

  it('keeps vatAmountLocalByRate null for a single charged rate', async () => {
    const service = serviceWithRate('4.2512', '2026-09-16');
    const result = await resolveLocalCurrencyVatSnapshot(
      baseInput({ vatGroups: [{ rateBp: 2300, vatAmount: 123456 }] }),
      service,
    );
    expect(result?.vatAmountLocalByRate).toBeNull();
  });

  describe('applyReusedLocalCurrencyRate', () => {
    it('converts the correction amount with the original invoice rate, not a fresh one', () => {
      const snapshot = applyReusedLocalCurrencyRate({
        localCurrency: 'RON',
        exchangeRate: '4.9771',
        exchangeRateDate: new Date('2026-09-16T00:00:00.000Z'),
        exchangeRateSource: 'BNR',
        exchangeRateTable: null,
        vatAmount: -123456,
      });
      expect(snapshot).toEqual({
        localCurrency: 'RON',
        exchangeRate: '4.9771',
        exchangeRateDate: new Date('2026-09-16T00:00:00.000Z'),
        exchangeRateSource: 'BNR',
        exchangeRateTable: null,
        vatAmountLocal: Math.round(-123456 * 4.9771),
        vatAmountLocalByRate: null,
      });
    });

    it('splits the reused rate per charged group too', () => {
      const snapshot = applyReusedLocalCurrencyRate({
        localCurrency: 'PLN',
        exchangeRate: '4.2512',
        exchangeRateDate: new Date('2026-09-16T00:00:00.000Z'),
        exchangeRateSource: 'NBP',
        exchangeRateTable: null,
        vatAmount: 354,
        vatGroups: [
          { rateBp: 2300, vatAmount: 138 },
          { rateBp: 800, vatAmount: 216 },
        ],
      });
      expect(snapshot.vatAmountLocalByRate).toEqual([
        { rateBp: 2300, vatAmountLocal: Math.round(138 * 4.2512) },
        { rateBp: 800, vatAmountLocal: Math.round(216 * 4.2512) },
      ]);
    });
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
