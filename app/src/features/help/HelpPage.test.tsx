// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HelpContent } from './types';

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

import { HelpPage } from './HelpPage';

vi.mock('@app/auth/hooks', () => ({
  useAuthSession: () => ({ session: null, isPending: false, error: null }),
}));

const CHROME = {
  pageTitle: 'How to use',
  tocLabel: 'On this page',
  emptyTitle: "Help isn't available in your language yet",
  emptyDescription: "We're still translating this page. Check back soon.",
};

const CONTENT: HelpContent = {
  locale: 'en',
  title: 'How to use Fakturcho',
  intro: 'A short intro to the help page.',
  sections: [
    {
      heading: 'Issue your first document',
      id: 'issue-your-first-document',
      blocks: [{ type: 'p', inline: [{ text: 'Section body paragraph.' }] }],
    },
  ],
  faqHeading: 'Frequently asked questions',
  faq: [{ question: 'FAQ question?', answer: [{ text: 'FAQ answer.' }] }],
};

function renderPage(content: HelpContent | undefined) {
  useGetIssuerProfileQueryMock.mockReturnValue({ data: undefined });
  guideForIssuerCountryMock.mockReturnValue(undefined);
  return render(
    <NextIntlClientProvider locale="bg" messages={bgMessages}>
      <HelpPage content={content} chrome={CHROME} />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  useGetIssuerProfileQueryMock.mockReset();
  guideForIssuerCountryMock.mockReset();
});

describe('HelpPage', () => {
  it('renders the content title, intro, table of contents, sections and FAQ', () => {
    renderPage(CONTENT);
    expect(screen.getByRole('heading', { level: 1, name: 'How to use Fakturcho' })).toBeTruthy();
    expect(screen.getByText('A short intro to the help page.')).toBeTruthy();
    const tocLink = screen.getByRole('link', { name: 'Issue your first document' });
    expect(tocLink.getAttribute('href')).toBe('#issue-your-first-document');
    expect(screen.getByText('Section body paragraph.')).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' }),
    ).toBeTruthy();
    expect(screen.getByText('FAQ question?')).toBeTruthy();
  });

  it('falls back to the chrome title and an empty state when content is absent', () => {
    renderPage(undefined);
    expect(screen.getByRole('heading', { level: 1, name: 'How to use' })).toBeTruthy();
    expect(screen.getByText("Help isn't available in your language yet")).toBeTruthy();
    expect(screen.getByText("We're still translating this page. Check back soon.")).toBeTruthy();
    expect(screen.queryByText('Frequently asked questions')).toBeNull();
  });
});
