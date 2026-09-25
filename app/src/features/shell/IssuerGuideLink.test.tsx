// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IssuerGuideLink } from './IssuerGuideLink';

const { useGetIssuerProfileQueryMock, guideForIssuerCountryMock } = vi.hoisted(() => ({
  useGetIssuerProfileQueryMock: vi.fn(),
  guideForIssuerCountryMock: vi.fn(),
}));

vi.mock('@app/api', () => ({
  useGetIssuerProfileQuery: useGetIssuerProfileQueryMock,
}));

vi.mock('@app/features/guides/registry', () => ({
  guideForIssuerCountry: guideForIssuerCountryMock,
  guideHref: () => '/guide/faktura',
}));

afterEach(() => {
  cleanup();
  useGetIssuerProfileQueryMock.mockReset();
  guideForIssuerCountryMock.mockReset();
});

function renderLink() {
  return render(
    <NextIntlClientProvider locale="bg" messages={bgMessages}>
      <IssuerGuideLink />
    </NextIntlClientProvider>,
  );
}

describe('IssuerGuideLink', () => {
  it('renders nothing while the issuer profile has not loaded yet', () => {
    useGetIssuerProfileQueryMock.mockReturnValue({ data: undefined });
    guideForIssuerCountryMock.mockReturnValue(undefined);
    const { container } = renderLink();
    expect(container.firstChild).toBeNull();
  });

  it("links to the issuer's own country guide when one exists", () => {
    useGetIssuerProfileQueryMock.mockReturnValue({ data: { country: 'BG' } });
    guideForIssuerCountryMock.mockReturnValue({ slug: 'faktura', locale: 'bg' });
    renderLink();
    const link = screen.getByRole('link', { name: bgMessages.shell.guideLink });
    expect(link.getAttribute('href')).toBe('/guide/faktura');
    expect(guideForIssuerCountryMock).toHaveBeenCalledWith('BG');
  });

  it('renders nothing when neither the country guide nor the EU guide exists', () => {
    useGetIssuerProfileQueryMock.mockReturnValue({ data: { country: 'US' } });
    guideForIssuerCountryMock.mockReturnValue(undefined);
    const { container } = renderLink();
    expect(container.firstChild).toBeNull();
  });
});
