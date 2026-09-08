import { describe, expect, it, vi } from 'vitest';
import { AdminTrafficService } from './admin-traffic.service';
import type { UmamiClient } from './umami.client';

function clientWith(overrides: Partial<UmamiClient>): UmamiClient {
  return {
    isConfigured: true,
    dashboardUrl: 'https://umami.example.com/websites/site-1',
    ...overrides,
  } as unknown as UmamiClient;
}

describe('AdminTrafficService', () => {
  it('maps Umami stats into a connected overview', async () => {
    const client = clientWith({
      stats: vi.fn().mockResolvedValue({
        pageviews: { value: 500 },
        visitors: { value: 120 },
        visits: { value: 150 },
        bounces: { value: 30 },
        totaltime: { value: 4500 },
      }),
      series: vi.fn().mockResolvedValue({
        pageviews: [{ x: '2026-09-01', y: 100 }],
        sessions: [{ x: '2026-09-01', y: 40 }],
      }),
      metrics: vi.fn((_range, type) => {
        if (type === 'path') return Promise.resolve([{ x: '/documents', y: 80 }]);
        if (type === 'referrer') return Promise.resolve([{ x: 'google.com', y: 60 }]);
        return Promise.resolve([{ x: 'desktop', y: 90 }]);
      }),
    });

    const overview = await new AdminTrafficService(client).overview({});

    expect(overview).toEqual({
      connected: true,
      visitors: 120,
      uniqueVisitors: 120,
      pageviews: 500,
      sessions: 150,
      bounceRatePct: 20,
      avgDurationSec: 30,
      series: [{ date: '2026-09-01', visitors: 40, pageviews: 100 }],
      referrers: [{ referrer: 'google.com', visitors: 60, pageviews: 60 }],
      pages: [{ path: '/documents', pageviews: 80, uniqueVisitors: 80 }],
      devices: [{ device: 'desktop', visitors: 90 }],
      dashboardUrl: 'https://umami.example.com/websites/site-1',
    });
  });

  it('returns a zeroed disconnected overview when Umami is unconfigured', async () => {
    const client = clientWith({ isConfigured: false, dashboardUrl: null });

    const overview = await new AdminTrafficService(client).overview({});

    expect(overview).toEqual({
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
      dashboardUrl: null,
    });
  });

  it('treats a date-only "to" as inclusive of that whole day', async () => {
    const stats = vi.fn().mockResolvedValue({});
    const client = clientWith({
      stats,
      series: vi.fn().mockResolvedValue(null),
      metrics: vi.fn().mockResolvedValue(null),
    });

    await new AdminTrafficService(client).overview({ to: '2026-09-08' });

    expect(stats).toHaveBeenCalledWith({
      startAt: Date.parse('2026-09-09') - 30 * 24 * 60 * 60 * 1000,
      endAt: Date.parse('2026-09-09'),
    });
  });

  it('gives a 24h range, not a zero-width one, when "from" equals "to"', async () => {
    const stats = vi.fn().mockResolvedValue({});
    const client = clientWith({
      stats,
      series: vi.fn().mockResolvedValue(null),
      metrics: vi.fn().mockResolvedValue(null),
    });

    await new AdminTrafficService(client).overview({ from: '2026-09-08', to: '2026-09-08' });

    expect(stats).toHaveBeenCalledWith({
      startAt: Date.parse('2026-09-08'),
      endAt: Date.parse('2026-09-09'),
    });
  });

  it('fails soft to a disconnected overview when the client throws', async () => {
    const client = clientWith({
      stats: vi.fn().mockRejectedValue(new Error('network down')),
      series: vi.fn().mockResolvedValue(null),
      metrics: vi.fn().mockResolvedValue(null),
    });

    const overview = await new AdminTrafficService(client).overview({});

    expect(overview.connected).toBe(false);
    expect(overview.visitors).toBe(0);
    expect(overview.series).toEqual([]);
  });
});
