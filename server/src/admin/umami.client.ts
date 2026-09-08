import { Injectable, Logger } from '@nestjs/common';

export type UmamiRange = { startAt: number; endAt: number };

type UmamiStatValue = number | { value: number; prev?: number };

export type UmamiStats = {
  pageviews: UmamiStatValue;
  visitors: UmamiStatValue;
  visits: UmamiStatValue;
  bounces: UmamiStatValue;
  totaltime: UmamiStatValue;
};

export type UmamiSeries = {
  pageviews: Array<{ x: string; y: number }>;
  sessions: Array<{ x: string; y: number }>;
};

export type UmamiMetric = { x: string | null; y: number };

const REQUEST_TIMEOUT_MS = 8000;
const SELF_HOSTED_PREFIX = '/api';
const CLOUD_PREFIX = '';

@Injectable()
export class UmamiClient {
  private readonly logger = new Logger(UmamiClient.name);
  private readonly baseUrl: string | undefined;
  private readonly websiteId: string | undefined;
  private readonly username: string | undefined;
  private readonly password: string | undefined;
  private readonly apiKey: string | undefined;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.UMAMI_API_URL?.replace(/\/+$/, '');
    this.websiteId = process.env.UMAMI_WEBSITE_ID;
    this.username = process.env.UMAMI_USERNAME;
    this.password = process.env.UMAMI_PASSWORD;
    this.apiKey = process.env.UMAMI_API_KEY;
    if (!this.isConfigured) {
      this.logger.warn(
        'Umami not configured — set UMAMI_API_URL + UMAMI_WEBSITE_ID plus either UMAMI_API_KEY or UMAMI_USERNAME + UMAMI_PASSWORD.',
      );
    }
  }

  private get usesApiKey(): boolean {
    return Boolean(this.apiKey);
  }

  private get pathPrefix(): string {
    return this.usesApiKey ? CLOUD_PREFIX : SELF_HOSTED_PREFIX;
  }

  get isConfigured(): boolean {
    if (!this.baseUrl || !this.websiteId) return false;
    return this.usesApiKey || Boolean(this.username && this.password);
  }

  get dashboardUrl(): string | null {
    if (!this.baseUrl || !this.websiteId) return null;
    return `${this.baseUrl}/websites/${this.websiteId}`;
  }

  private async login(): Promise<string | null> {
    if (!this.baseUrl || !this.username || !this.password) return null;
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: this.username, password: this.password }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`Umami login failed: HTTP ${res.status}`);
        return null;
      }
      const body = (await res.json()) as { token?: string };
      this.token = body.token ?? null;
      return this.token;
    } catch (err) {
      this.logger.warn(`Umami login error: ${(err as Error).message}`);
      return null;
    }
  }

  private async get<T>(path: string, params: Record<string, string>): Promise<T | null> {
    if (!this.baseUrl || !this.isConfigured) return null;
    const url = new URL(`${this.baseUrl}${this.pathPrefix}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    if (this.usesApiKey) {
      try {
        const res = await fetch(url, {
          headers: {
            'x-umami-api-key': this.apiKey as string,
            accept: 'application/json',
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!res.ok) {
          this.logger.warn(`Umami GET ${path} failed: HTTP ${res.status}`);
          return null;
        }
        return (await res.json()) as T;
      } catch (err) {
        this.logger.warn(`Umami GET ${path} error: ${(err as Error).message}`);
        return null;
      }
    }

    const doFetch = (token: string) =>
      fetch(url, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

    try {
      let token = this.token ?? (await this.login());
      if (!token) return null;
      let res = await doFetch(token);
      if (res.status === 401) {
        token = await this.login();
        if (!token) return null;
        res = await doFetch(token);
      }
      if (!res.ok) {
        this.logger.warn(`Umami GET ${path} failed: HTTP ${res.status}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      this.logger.warn(`Umami GET ${path} error: ${(err as Error).message}`);
      return null;
    }
  }

  stats(range: UmamiRange): Promise<UmamiStats | null> {
    return this.get<UmamiStats>(`/websites/${this.websiteId}/stats`, {
      startAt: String(range.startAt),
      endAt: String(range.endAt),
    });
  }

  series(range: UmamiRange, unit = 'day', timezone = 'Europe/Sofia'): Promise<UmamiSeries | null> {
    return this.get<UmamiSeries>(`/websites/${this.websiteId}/pageviews`, {
      startAt: String(range.startAt),
      endAt: String(range.endAt),
      unit,
      timezone,
    });
  }

  metrics(
    range: UmamiRange,
    type: 'url' | 'referrer' | 'device',
    limit = 8,
  ): Promise<UmamiMetric[] | null> {
    return this.get<UmamiMetric[]>(`/websites/${this.websiteId}/metrics`, {
      startAt: String(range.startAt),
      endAt: String(range.endAt),
      type,
      limit: String(limit),
    });
  }
}
