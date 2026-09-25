// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getFeatureFlagsMock, getLocaleMock } = vi.hoisted(() => ({
  getFeatureFlagsMock: vi.fn(),
  getLocaleMock: vi.fn(),
}));

vi.mock('@app/feature-flags', () => ({
  getFeatureFlags: getFeatureFlagsMock,
  FeatureFlagsProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('next-intl/server', () => ({ getLocale: getLocaleMock }));
vi.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../store/providers', () => ({
  Providers: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('next/script', () => ({ default: () => null }));
vi.mock('./fonts', () => ({ uiFont: { variable: 'font-var' } }));

import RootLayout, { generateMetadata } from './layout';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderLayout(locale: 'bg' | 'en') {
  getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });
  getLocaleMock.mockResolvedValue(locale);
  const element = await RootLayout({ children: <span>page content</span> });
  return render(element);
}

describe('RootLayout', () => {
  it('sets html lang to bg for a Bulgarian request', async () => {
    await renderLayout('bg');

    expect(document.querySelector('html')?.lang).toBe('bg');
    expect(screen.getByText('page content')).toBeTruthy();
  });

  it('sets html lang to en for an /en request', async () => {
    await renderLayout('en');

    expect(document.querySelector('html')?.lang).toBe('en');
  });

  it('keeps the Bulgarian title template and brand for bg', async () => {
    getLocaleMock.mockResolvedValue('bg');
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual({
      default: 'Фактурчо — фактури за българския бизнес',
      template: '%s — Фактурчо',
    });
    expect(metadata.openGraph?.siteName).toBe('Фактурчо');
  });

  it('uses the Latin brand and the locale copy for every other locale', async () => {
    getLocaleMock.mockResolvedValue('de');
    const metadata = await generateMetadata();
    expect(metadata.title).toMatchObject({ template: '%s — Fakturcho' });
    expect(JSON.stringify(metadata)).not.toMatch(/[\u0400-\u04FF]/);
  });
});
