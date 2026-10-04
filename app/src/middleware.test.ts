import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetEnLocaleCache } from './i18n/enLocaleCache';
import { LOCALE_HEADER } from './i18n/locale';
import { config, middleware } from './middleware';

function request(pathname: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(pathname, 'https://www.fakturcho.com'), { headers });
}

function apexRequest(pathAndQuery: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(pathAndQuery, 'https://fakturcho.com'), {
    headers: { host: 'fakturcho.com', ...headers },
  });
}

function stubFlags(enEnabled: boolean) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ EN_LOCALE: enEnabled }) }),
  );
}

beforeEach(() => {
  resetEnLocaleCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('middleware', () => {
  it('tags an /en request with the en locale header', async () => {
    stubFlags(false);
    const response = await middleware(request('/en/signup'));

    expect(response.headers.get('x-middleware-request-x-locale')).toBe('en');
  });

  it('tags every other request with the bg locale header', async () => {
    stubFlags(false);
    const response = await middleware(request('/documents'));

    expect(response.headers.get('x-middleware-request-x-locale')).toBe('bg');
  });

  it('uses the shared locale header name', () => {
    expect(LOCALE_HEADER).toBe('x-locale');
  });

  it('auto-redirects the bg homepage to /en for a non-bg browser when EN is on', async () => {
    stubFlags(true);
    const response = await middleware(request('/', { 'accept-language': 'en-US' }));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://www.fakturcho.com/en');
    expect(response.headers.get('Vary')).toBe('Accept-Language, Cookie');
  });

  it('keeps a Bulgarian IP on the bg homepage despite a non-bg browser', async () => {
    stubFlags(true);
    const response = await middleware(
      request('/', { 'accept-language': 'en-US', 'x-real-ip': '2.56.12.1' }),
    );

    expect(response.status).not.toBe(307);
    expect(response.headers.get('Vary')).toBe('Accept-Language, Cookie');
  });

  it('sends a Bulgarian IP from /en back to the bg homepage', async () => {
    stubFlags(true);
    const response = await middleware(
      request('/en', { 'accept-language': 'en-US', 'x-real-ip': '2.56.12.1' }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://www.fakturcho.com/');
  });

  it('does not redirect when EN is off', async () => {
    stubFlags(false);
    const response = await middleware(request('/', { 'accept-language': 'en-US' }));

    expect(response.status).not.toBe(307);
  });

  it('sets Vary on a plain pass-through of a public entry path', async () => {
    stubFlags(true);
    const response = await middleware(request('/', { 'accept-language': 'bg' }));

    expect(response.status).not.toBe(307);
    expect(response.headers.get('Vary')).toBe('Accept-Language, Cookie');
  });

  it('never redirects an app route even with an EN Accept-Language', async () => {
    stubFlags(true);
    const response = await middleware(request('/documents', { 'accept-language': 'en-US' }));

    expect(response.status).not.toBe(307);
    expect(response.headers.get('Vary')).toBeNull();
  });

  it('handles an explicit ?lang=en and sets the locale cookie', async () => {
    stubFlags(true);
    const response = await middleware(request('/login?lang=en'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://www.fakturcho.com/en/login');
    expect(response.headers.get('set-cookie')).toContain('fakturcho_lang=en');
  });

  describe('apex host', () => {
    it.each([
      ['/', 'https://www.fakturcho.com'],
      ['/en', 'https://www.fakturcho.com/en'],
      ['/de/signup?country=AT', 'https://www.fakturcho.com/de/signup?country=AT'],
      ['/guide/x', 'https://www.fakturcho.com/guide/x'],
      ['/api/health', 'https://www.fakturcho.com/api/health'],
      ['/robots.txt', 'https://www.fakturcho.com/robots.txt'],
      ['/%C3%A9?q=a%26b', 'https://www.fakturcho.com/%C3%A9?q=a%26b'],
    ])('308s %s to %s in one hop', async (path, location) => {
      stubFlags(true);
      const response = await middleware(apexRequest(path));

      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toBe(location);
    });

    it('redirects before the locale logic, whatever the browser language', async () => {
      stubFlags(true);
      const response = await middleware(apexRequest('/', { 'accept-language': 'en-US' }));

      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toBe('https://www.fakturcho.com');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('matches the host with a port and in upper case', async () => {
      stubFlags(true);
      const response = await middleware(apexRequest('/en', { host: 'Fakturcho.com:443' }));

      expect(response.status).toBe(308);
    });

    it('adds an apex-only matcher that still skips next static assets', () => {
      const apex = config.matcher.find((entry) => typeof entry === 'object');

      expect(apex).toEqual({
        source: '/((?!_next/static|_next/image).*)',
        has: [{ type: 'host', value: 'fakturcho.com' }],
      });
      expect(config.matcher[0]).toBe('/((?!_next|api|.*\\..*).*)');
    });

    it('leaves the www host to the locale logic', async () => {
      stubFlags(true);
      const response = await middleware(
        request('/', { host: 'www.fakturcho.com', 'accept-language': 'en-US' }),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('https://www.fakturcho.com/en');
    });
  });
});
