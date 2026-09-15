import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { headersMock, cookiesMock, getFeatureFlagsMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
  cookiesMock: vi.fn(),
  getFeatureFlagsMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: headersMock, cookies: cookiesMock }));
vi.mock('../feature-flags', () => ({ getFeatureFlags: getFeatureFlagsMock }));

import { buildRequestConfig } from './request';

function stubHeader(value: string | null) {
  headersMock.mockResolvedValue({ get: (name: string) => (name === 'x-locale' ? value : null) });
}

function stubCookies(entries: Array<{ name: string; value: string }>) {
  cookiesMock.mockResolvedValue({ getAll: () => entries });
}

interface StubFetchOptions {
  me?: { ok: boolean; status?: number; body?: unknown };
}

function stubFetch({ me }: StubFetchOptions) {
  const fetchMock = vi.fn(() => {
    if (!me) return Promise.reject(new Error('unexpected /api/me call'));
    if (me.ok) return Promise.resolve({ ok: true, json: async () => me.body });
    return Promise.resolve({ ok: false, status: me.status ?? 401, json: async () => ({}) });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  cookiesMock.mockReset();
  getFeatureFlagsMock.mockReset();
});

describe('buildRequestConfig', () => {
  it('resolves Bulgarian when the middleware sets no locale header', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });
    stubCookies([]);

    const config = await buildRequestConfig();

    expect(config.locale).toBe('bg');
    expect(config.messages).toEqual(bgMessages);
  });

  it('resolves English when the middleware marks the request en', async () => {
    stubHeader('en');

    const config = await buildRequestConfig();

    expect(config.locale).toBe('en');
    expect(config.messages).toEqual(enMessages);
  });

  it('falls back to Bulgarian for an unrecognized header value', async () => {
    stubHeader('ja');
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });
    stubCookies([]);

    const config = await buildRequestConfig();

    expect(config.locale).toBe('bg');
  });

  it('overrides to the session locale for an authenticated user on a bg-path route', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    stubFetch({ me: { ok: true, body: { locale: 'en' } } });

    const config = await buildRequestConfig();

    expect(config.locale).toBe('en');
    expect(config.messages).toEqual(enMessages);
  });

  it('forwards the request cookies to the server-side /api/me call', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });
    stubCookies([
      { name: 'better-auth.session_token', value: 'abc' },
      { name: 'other', value: '1' },
    ]);
    const fetchMock = stubFetch({ me: { ok: true, body: { locale: 'en' } } });

    await buildRequestConfig();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: 'better-auth.session_token=abc; other=1',
        }),
      }),
    );
  });

  it('skips the override and stays bg when there is no session', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });
    stubCookies([]);
    const fetchMock = stubFetch({});

    const config = await buildRequestConfig();

    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/me'),
      expect.anything(),
    );
    expect(config.locale).toBe('bg');
  });

  it('falls back without throwing when the /api/me request errors', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    );

    const config = await buildRequestConfig();

    expect(config.locale).toBe('bg');
  });

  it('falls back when /api/me responds not-ok', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    stubFetch({ me: { ok: false, status: 401 } });

    const config = await buildRequestConfig();

    expect(config.locale).toBe('bg');
  });

  it('renders bg with no wasted override when the session locale is already bg', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    const fetchMock = stubFetch({ me: { ok: true, body: { locale: 'bg' } } });

    const config = await buildRequestConfig();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/me'), expect.anything());
    expect(config.locale).toBe('bg');
  });

  it('ignores an unrecognized session locale value and falls back to bg', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    stubFetch({ me: { ok: true, body: { locale: 'ja' } } });

    const config = await buildRequestConfig();

    expect(config.locale).toBe('bg');
  });

  it('EN_LOCALE off: skips the /api/me call entirely and renders bg', async () => {
    stubHeader(null);
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    const fetchMock = stubFetch({ me: { ok: true, body: { locale: 'en' } } });

    const config = await buildRequestConfig();

    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/me'),
      expect.anything(),
    );
    expect(config.locale).toBe('bg');
  });

  it('does not consult the session when the path already resolves to en', async () => {
    stubHeader('en');

    const config = await buildRequestConfig();

    expect(getFeatureFlagsMock).not.toHaveBeenCalled();
    expect(config.locale).toBe('en');
  });
});
