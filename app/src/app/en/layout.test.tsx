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

import EnglishLayout from './layout';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('EnglishLayout', () => {
  it('calls notFound when EN_LOCALE is off', async () => {
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });

    await expect(EnglishLayout({ children: <span>hi</span> })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('renders the children when EN_LOCALE is on', async () => {
    getFeatureFlagsMock.mockResolvedValue({ EN_LOCALE: true, EINVOICE: false, PEPPOL: false });

    const element = await EnglishLayout({ children: <span>hi</span> });
    render(element);

    expect(notFoundMock).not.toHaveBeenCalled();
    expect(screen.getByText('hi')).toBeTruthy();
  });
});
