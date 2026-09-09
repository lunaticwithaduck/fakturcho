import { Injectable, Logger } from '@nestjs/common';

const VIES_ENDPOINT = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

export interface VatCheckResult {
  valid: boolean | 'unverified';
}

export interface ViesHttpClient {
  checkVatNumber(countryCode: string, vatNumber: string): Promise<{ valid: boolean } | null>;
}

class FetchViesHttpClient implements ViesHttpClient {
  async checkVatNumber(countryCode: string, vatNumber: string): Promise<{ valid: boolean } | null> {
    const res = await fetch(VIES_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ countryCode, vatNumber }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const parsed = (await res.json()) as { valid?: unknown };
    if (typeof parsed.valid !== 'boolean') return null;
    return { valid: parsed.valid };
  }
}

interface CacheEntry {
  valid: boolean;
  cachedAt: number;
}

@Injectable()
export class ViesService {
  private readonly logger = new Logger(ViesService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly httpClient: ViesHttpClient = new FetchViesHttpClient()) {}

  async checkVatNumber(countryCode: string, vatNumber: string): Promise<VatCheckResult> {
    const key = `${countryCode}:${vatNumber}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return { valid: cached.valid };
    }

    try {
      const result = await this.httpClient.checkVatNumber(countryCode, vatNumber);
      if (!result) return { valid: 'unverified' };
      this.cache.set(key, { valid: result.valid, cachedAt: Date.now() });
      return { valid: result.valid };
    } catch (err) {
      this.logger.warn(`VIES check failed for ${key}: ${(err as Error).message}`);
      return { valid: 'unverified' };
    }
  }
}
