// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from './LocaleProvider';

function EmailLabelProbe() {
  const t = useTranslations('auth');
  return <span>{t('emailLabel')}</span>;
}

function renderProbe(children: ReactNode = <EmailLabelProbe />) {
  return render(
    <NextIntlClientProvider locale="bg" messages={bgMessages}>
      <LocaleProvider>{children}</LocaleProvider>
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('LocaleProvider', () => {
  it('switches to English once /api/me resolves an English locale', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ locale: 'en' }),
      }),
    );

    renderProbe();

    expect(screen.getByText('Имейл')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Email')).toBeTruthy());
  });

  it('stays on Bulgarian when /api/me resolves the Bulgarian locale', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ locale: 'bg' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('stays on Bulgarian for an unauthenticated visitor', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('falls back to Bulgarian instead of throwing when the request errors', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    expect(() => renderProbe()).not.toThrow();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('ignores an unknown locale value and stays on Bulgarian', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ locale: 'fr' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText('Имейл')).toBeTruthy();
  });

  it('sets the html lang attribute once an English override resolves', async () => {
    document.documentElement.lang = 'bg';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ locale: 'en' }),
      }),
    );

    renderProbe();

    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
  });

  it('leaves the html lang attribute alone when the locale stays Bulgarian', async () => {
    document.documentElement.lang = 'bg';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ locale: 'bg' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(document.documentElement.lang).toBe('bg');
  });
});
