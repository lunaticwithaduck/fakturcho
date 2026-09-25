// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuideIndexPage } from './GuideIndexPage';
import type { GuideContent } from './types';

vi.mock('@app/auth/hooks', () => ({
  useAuthSession: () => ({ session: null, isPending: false, error: null }),
}));

function stubGuide(country: GuideContent['country'], locale: GuideContent['locale']): GuideContent {
  return {
    country,
    locale,
    slug: `${country.toLowerCase()}-slug`,
    title: `${country} title`,
    description: `${country} description`,
    h1: `${country} h1`,
    answer: 'answer',
    lastReviewed: '2026-09-25',
    sections: [],
    faqHeading: 'FAQ',
    faq: [],
    cta: { heading: 'CTA', body: [] },
  };
}

afterEach(cleanup);

describe('GuideIndexPage', () => {
  it('lists the guides for that locale and links each one to its own guide route', () => {
    render(
      <GuideIndexPage
        locale="de"
        heading="Leitfäden"
        guides={[stubGuide('DE', 'de')]}
        euOverviewLabel="EU-Überblick"
        backToAppLabel="Back to the app"
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Leitfäden' })).toBeTruthy();
    const link = screen.getByRole('link', { name: 'DE h1' });
    expect(link.getAttribute('href')).toBe('/de/guide/de-slug');
  });

  it('adds a link to the EU overview when locale is not en', () => {
    render(
      <GuideIndexPage
        locale="de"
        heading="Leitfäden"
        guides={[]}
        euOverview={stubGuide('EU', 'en')}
        euOverviewLabel="EU-Überblick"
        backToAppLabel="Back to the app"
      />,
    );
    const link = screen.getByRole('link', { name: 'EU-Überblick' });
    expect(link.getAttribute('href')).toBe('/en/guide/eu-slug');
  });

  it('does not duplicate the EU overview link on the en index itself', () => {
    render(
      <GuideIndexPage
        locale="en"
        heading="Guides"
        guides={[stubGuide('EU', 'en')]}
        euOverview={stubGuide('EU', 'en')}
        euOverviewLabel="EU overview guide"
        backToAppLabel="Back to the app"
      />,
    );
    expect(screen.queryByRole('link', { name: 'EU overview guide' })).toBeNull();
  });
});
