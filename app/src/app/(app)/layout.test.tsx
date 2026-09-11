// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@app/auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@app/features/shell/AppShell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => children,
}));

import AppGroupLayout from './layout';

function EmailLabelProbe() {
  const t = useTranslations('auth');
  return <span>{t('emailLabel')}</span>;
}

function stubCookies(entries: Array<{ name: string; value: string }>) {
  cookiesMock.mockResolvedValue({ getAll: () => entries });
}

interface StubFetchOptions {
  me?: { ok: boolean; status?: number; body?: unknown };
  enLocale?: boolean;
  featureFlagsThrows?: boolean;
}

function stubFetch({ me, enLocale = true, featureFlagsThrows = false }: StubFetchOptions) {
  const fetchMock = vi.fn((url: unknown) => {
    const href = String(url);
    if (href.includes('/api/feature-flags')) {
      if (featureFlagsThrows) return Promise.reject(new Error('network down'));
      return Promise.resolve({
        ok: true,
        json: async () => ({ EN_LOCALE: enLocale, EINVOICE: false, PEPPOL: false }),
      });
    }
    if (!me) return Promise.reject(new Error('unexpected /api/me call'));
    if (me.ok) return Promise.resolve({ ok: true, json: async () => me.body });
    return Promise.resolve({ ok: false, status: me.status ?? 401, json: async () => ({}) });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function renderLayout() {
  const element = await AppGroupLayout({ children: <EmailLabelProbe /> });
  return render(
    <NextIntlClientProvider locale="bg" messages={bgMessages}>
      {element}
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  cookiesMock.mockReset();
});

describe('AppGroupLayout', () => {
  it('renders English server-side, before any client fetch, for a session resolving en', async () => {
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    stubFetch({ me: { ok: true, body: { locale: 'en' } } });

    await renderLayout();

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.queryByText('Имейл')).toBeNull();
  });

  it('forwards the request cookies to the server-side /api/me call', async () => {
    stubCookies([
      { name: 'better-auth.session_token', value: 'abc' },
      { name: 'other', value: '1' },
    ]);
    const fetchMock = stubFetch({ me: { ok: true, body: { locale: 'en' } } });

    await renderLayout();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: 'better-auth.session_token=abc; other=1',
        }),
      }),
    );
  });

  it('skips the override and renders the outer bg default when there is no session', async () => {
    stubCookies([]);
    const fetchMock = stubFetch({});

    await renderLayout();

    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/me'),
      expect.anything(),
    );
    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('falls back without throwing when the /api/me request errors', async () => {
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    const fetchMock = vi.fn((url: unknown) => {
      const href = String(url);
      if (href.includes('/api/feature-flags')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false }),
        });
      }
      return Promise.reject(new Error('network down'));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(renderLayout()).resolves.toBeDefined();
    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('falls back when /api/me responds not-ok', async () => {
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    stubFetch({ me: { ok: false, status: 401 } });

    await renderLayout();

    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('renders correctly with no wasted override when the session locale is already bg', async () => {
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    const fetchMock = stubFetch({ me: { ok: true, body: { locale: 'bg' } } });

    await renderLayout();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/me'), expect.anything());
    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('ignores an unrecognized locale value and falls back to the outer default', async () => {
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    stubFetch({ me: { ok: true, body: { locale: 'fr' } } });

    await renderLayout();

    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('EN_LOCALE off: skips the /api/me call entirely and renders bg', async () => {
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    const fetchMock = stubFetch({ me: { ok: true, body: { locale: 'en' } }, enLocale: false });

    await renderLayout();

    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/me'),
      expect.anything(),
    );
    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('falls back to bg when the feature-flags request errors', async () => {
    stubCookies([{ name: 'better-auth.session_token', value: 'abc' }]);
    stubFetch({ me: { ok: true, body: { locale: 'en' } }, featureFlagsThrows: true });

    await renderLayout();

    expect(screen.getByText('Имейл')).toBeTruthy();
  });
});
