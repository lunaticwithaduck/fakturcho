import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetEnLocaleCache } from './i18n/enLocaleCache';
import { LOCALE_HEADER } from './i18n/locale';
import { middleware } from './middleware';

function request(pathname: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(pathname, 'https://www.fakturcho.com'), { headers });
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
});
