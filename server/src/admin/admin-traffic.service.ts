import type { GetTrafficQuery, TrafficOverview } from '@fakturcho/shared-types';
import { Injectable, Logger } from '@nestjs/common';
import { UmamiClient, type UmamiMetric, type UmamiSeries, type UmamiStats } from './umami.client';

const DEFAULT_RANGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function num(value: number | { value: number } | null | undefined): number {
  if (value == null) return 0;
  const raw = typeof value === 'number' ? value : value.value;
  return Number.isFinite(raw) ? raw : 0;
}

@Injectable()
export class AdminTrafficService {
  private readonly logger = new Logger(AdminTrafficService.name);

  constructor(private readonly umami: UmamiClient) {}

  async overview(query: GetTrafficQuery): Promise<TrafficOverview> {
    const empty = this.emptyOverview();
    if (!this.umami.isConfigured) {
      this.logger.warn('Traffic overview: Umami not configured — returning empty payload.');
      return empty;
    }

    const range = this.resolveRange(query);
    try {
      const [stats, series, pages, referrers, devices] = await Promise.all([
        this.umami.stats(range),
        this.umami.series(range),
        this.umami.metrics(range, 'url'),
        this.umami.metrics(range, 'referrer'),
        this.umami.metrics(range, 'device'),
      ]);

      if (!stats) {
        this.logger.warn('Traffic overview: Umami stats unavailable — returning empty payload.');
        return empty;
      }

      return this.mapOverview(stats, series, pages, referrers, devices);
    } catch (err) {
      this.logger.warn(`Traffic overview: Umami request failed — ${(err as Error).message}`);
      return empty;
    }
  }

  private emptyOverview(): TrafficOverview {
    return {
      connected: false,
      visitors: 0,
      uniqueVisitors: 0,
      pageviews: 0,
      sessions: 0,
      bounceRatePct: 0,
      avgDurationSec: 0,
      series: [],
      referrers: [],
      pages: [],
      devices: [],
      dashboardUrl: this.umami.dashboardUrl,
    };
  }

  private resolveRange(query: GetTrafficQuery): { startAt: number; endAt: number } {
    const parsedEnd = query.to ? Date.parse(query.to) : Number.NaN;
    const endAt = Number.isFinite(parsedEnd) ? parsedEnd : Date.now();
    const parsedStart = query.from ? Date.parse(query.from) : Number.NaN;
    const startAt = Number.isFinite(parsedStart)
      ? parsedStart
      : endAt - DEFAULT_RANGE_DAYS * DAY_MS;
    return { startAt, endAt };
  }

  private mapOverview(
    stats: UmamiStats,
    series: UmamiSeries | null,
    pages: UmamiMetric[] | null,
    referrers: UmamiMetric[] | null,
    devices: UmamiMetric[] | null,
  ): TrafficOverview {
    const visits = num(stats.visits);
    const uniqueVisitors = num(stats.visitors);
    return {
      connected: true,
      visitors: uniqueVisitors,
      uniqueVisitors,
      pageviews: num(stats.pageviews),
      sessions: visits,
      bounceRatePct: visits > 0 ? Math.round((num(stats.bounces) / visits) * 100) : 0,
      avgDurationSec: visits > 0 ? Math.round(num(stats.totaltime) / visits) : 0,
      series: this.mapSeries(series),
      referrers: (referrers ?? []).map((metric) => ({
        referrer: metric.x || '(direct)',
        visitors: num(metric.y),
        pageviews: num(metric.y),
      })),
      pages: (pages ?? []).map((metric) => ({
        path: metric.x || '/',
        pageviews: num(metric.y),
        uniqueVisitors: num(metric.y),
      })),
      devices: (devices ?? []).map((metric) => ({
        device: metric.x || 'unknown',
        visitors: num(metric.y),
      })),
      dashboardUrl: this.umami.dashboardUrl,
    };
  }

  private mapSeries(series: UmamiSeries | null): TrafficOverview['series'] {
    if (!series) return [];
    const pageviewsByDate = new Map(
      (series.pageviews ?? []).map((point) => [point.x, num(point.y)]),
    );
    const sessionsByDate = new Map((series.sessions ?? []).map((point) => [point.x, num(point.y)]));
    const dates = new Set([...pageviewsByDate.keys(), ...sessionsByDate.keys()]);
    return [...dates].sort().map((date) => ({
      date,
      visitors: sessionsByDate.get(date) ?? 0,
      pageviews: pageviewsByDate.get(date) ?? 0,
    }));
  }
}
