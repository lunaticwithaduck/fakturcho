// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { notFoundMock, getFeatureFlagsMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  getFeatureFlagsMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({ notFound: notFoundMock }));
vi.mock('@app/feature-flags', () => ({ getFeatureFlags: getFeatureFlagsMock }));

import LocaleLayout, { generateStaticParams } from './layout';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('generateStaticParams', () => {
  it('lists every published locale except bg', () => {
    expect(generateStaticParams()).toEqual([{ locale: 'en' }]);
  });
});

describe('LocaleLayout', () => {
  it('calls notFound when EN_LOCALE is off', async () => {
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });

    await expect(
      LocaleLayout({ children: <span>hi</span>, params: Promise.resolve({ locale: 'en' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('calls notFound for an unpublished locale even when the flag is on', async () => {
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });

    await expect(
      LocaleLayout({ children: <span>hi</span>, params: Promise.resolve({ locale: 'xx' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('calls notFound for bg — it is not served from this tree', async () => {
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });

    await expect(
      LocaleLayout({ children: <span>hi</span>, params: Promise.resolve({ locale: 'bg' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders the children for a published locale when EN_LOCALE is on', async () => {
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });

    const element = await LocaleLayout({
      children: <span>hi</span>,
      params: Promise.resolve({ locale: 'en' }),
    });
    render(element);

    expect(notFoundMock).not.toHaveBeenCalled();
    expect(screen.getByText('hi')).toBeTruthy();
  });
});
