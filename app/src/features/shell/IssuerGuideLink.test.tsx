// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IssuerGuideLink } from './IssuerGuideLink';

const { useGetIssuerProfileQueryMock, guideForIssuerCountryMock, sessionMock } = vi.hoisted(() => ({
  useGetIssuerProfileQueryMock: vi.fn(),
  guideForIssuerCountryMock: vi.fn(),
  sessionMock: vi.fn(() => ({ session: null })),
}));

vi.mock('@app/auth/hooks', () => ({ useAuthSession: sessionMock }));

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
  sessionMock.mockReturnValue({ session: null });
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
    useGetIssuerProfileQueryMock.mockReturnValue({
      data: { country: 'BG', companyName: 'Студио ЕООД' },
    });
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

  it('uses the signup country until the issuer profile has been filled in', () => {
    useGetIssuerProfileQueryMock.mockReturnValue({ data: { country: 'BG', companyName: '' } });
    sessionMock.mockReturnValue({ session: { user: { country: 'DE' } } } as never);
    guideForIssuerCountryMock.mockReturnValue({ slug: 'rechnung', locale: 'de' });
    renderLink();
    expect(guideForIssuerCountryMock).toHaveBeenCalledWith('DE');
  });

  it('uses the issuer profile country once the profile has a company name', () => {
    useGetIssuerProfileQueryMock.mockReturnValue({ data: { country: 'PL', companyName: 'Firma' } });
    sessionMock.mockReturnValue({ session: { user: { country: 'DE' } } } as never);
    guideForIssuerCountryMock.mockReturnValue({ slug: 'faktura-ksef', locale: 'pl' });
    renderLink();
    expect(guideForIssuerCountryMock).toHaveBeenCalledWith('PL');
  });
});
