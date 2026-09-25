// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuidePage } from './GuidePage';
import type { GuideContent } from './types';

vi.mock('@app/auth/hooks', () => ({
  useAuthSession: () => ({ session: null, isPending: false, error: null }),
}));

const GUIDE: GuideContent = {
  country: 'DE',
  locale: 'de',
  slug: 'rechnung-pflichtangaben',
  title: 'Rechnung Pflichtangaben | Fakturcho',
  description: 'Was auf einer Rechnung stehen muss.',
  h1: 'Rechnung schreiben in Deutschland',
  answer: 'Direct answer paragraph under the H1.',
  lastReviewed: '2026-09-25',
  sections: [
    {
      heading: 'Erste Frage',
      id: 'erste-frage',
      blocks: [{ type: 'p', inline: [{ text: 'Section body paragraph.' }] }],
    },
  ],
  faqHeading: 'Häufige Fragen',
  faq: [{ question: 'FAQ question?', answer: [{ text: 'FAQ answer.' }] }],
  cta: { heading: 'So hilft Fakturcho', body: [{ text: 'CTA body sentence.' }] },
};

const CHROME = {
  homeLabel: 'Start',
  guidesLabel: 'Leitfäden',
  tocLabel: 'Auf dieser Seite',
  lastReviewedLabel: 'Zuletzt geprüft: {date}',
  signupLabel: 'Konto erstellen',
  brand: 'Fakturcho',
  backToAppLabel: 'Back to the app',
};

afterEach(cleanup);

describe('GuidePage', () => {
  it('renders the breadcrumb, H1 and the answer as the lead paragraph', () => {
    render(<GuidePage guide={GUIDE} chrome={CHROME} />);
    expect(screen.getByRole('heading', { level: 1, name: GUIDE.h1 })).toBeTruthy();
    expect(screen.getByText(GUIDE.answer)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Start' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Leitfäden' }).getAttribute('href')).toBe('/de/guide');
  });

  it('renders the locale-formatted last reviewed date', () => {
    render(<GuidePage guide={GUIDE} chrome={CHROME} />);
    expect(screen.getByText('Zuletzt geprüft: 25.09.2026')).toBeTruthy();
  });

  it('renders a table of contents linking to each section anchor', () => {
    render(<GuidePage guide={GUIDE} chrome={CHROME} />);
    const tocLink = screen.getByRole('link', { name: 'Erste Frage' });
    expect(tocLink.getAttribute('href')).toBe('#erste-frage');
  });

  it('renders the FAQ as a visible section with h2 + h3', () => {
    render(<GuidePage guide={GUIDE} chrome={CHROME} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Häufige Fragen' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'FAQ question?' })).toBeTruthy();
    expect(screen.getByText('FAQ answer.')).toBeTruthy();
  });

  it('renders the CTA with a signup link and a link back to the localized home', () => {
    render(<GuidePage guide={GUIDE} chrome={CHROME} />);
    expect(screen.getByRole('link', { name: CHROME.signupLabel }).getAttribute('href')).toBe(
      '/de/signup',
    );
    expect(screen.getAllByRole('link', { name: CHROME.brand })[0]?.getAttribute('href')).toBe(
      '/de',
    );
  });

  it('embeds server-rendered JSON-LD with an Article and a BreadcrumbList, never a FAQPage', () => {
    const { container } = render(<GuidePage guide={GUIDE} chrome={CHROME} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const parsed = JSON.parse(script?.textContent ?? '{}');
    const types = parsed['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toEqual(['Article', 'BreadcrumbList']);
    expect(script?.textContent).not.toContain('FAQPage');
  });
});
