import type { ExchangeRateSource } from '@fakturcho/shared-types';
import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  BnrExchangeRateHttpClient,
  EcbExchangeRateHttpClient,
  NbpExchangeRateHttpClient,
} from './exchange-rate-providers';

export interface ExchangeRateQuote {
  rate: string;
  rateDate: string;
  table: string | null;
}

export interface ExchangeRateHttpClient {
  fetchRateOn(currency: string, isoDate: string): Promise<ExchangeRateQuote | null>;
}

export type ExchangeRateHttpClients = Record<ExchangeRateSource, ExchangeRateHttpClient>;

// PL: last business day BEFORE the tax point (ustawa o VAT art. 31a) already
// lands the caller one day back; every source then walks further back over
// weekends and holidays, which surface as "no rate this date", not an error.
const MAX_WALKBACK_DAYS = 10;

function isoDateMinusDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function defaultClients(): ExchangeRateHttpClients {
  return {
    NBP: new NbpExchangeRateHttpClient(),
    BNR: new BnrExchangeRateHttpClient(),
    ECB: new EcbExchangeRateHttpClient(),
  };
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly cache = new Map<string, ExchangeRateQuote | null>();

  // The client map is a plain interface, not a class, so Nest's DI cannot
  // resolve a token for it; @Optional() stops Nest treating that as a
  // missing dependency and lets the JS default below supply the real clients.
  constructor(@Optional() private readonly clients: ExchangeRateHttpClients = defaultClients()) {}

  async fetchRate(params: {
    source: ExchangeRateSource;
    currency: string;
    onOrBeforeDate: string;
  }): Promise<ExchangeRateQuote | null> {
    const client = this.clients[params.source];
    for (let offset = 0; offset <= MAX_WALKBACK_DAYS; offset += 1) {
      const isoDate = isoDateMinusDays(params.onOrBeforeDate, offset);
      const cacheKey = `${params.source}:${params.currency}:${isoDate}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey) ?? null;
        if (cached) return cached;
        continue;
      }
      const quote = await client.fetchRateOn(params.currency, isoDate);
      this.cache.set(cacheKey, quote);
      if (quote) return quote;
    }
    this.logger.warn(
      `No ${params.source} rate for ${params.currency} within ${MAX_WALKBACK_DAYS} days on or before ${params.onOrBeforeDate}`,
    );
    return null;
  }
}
