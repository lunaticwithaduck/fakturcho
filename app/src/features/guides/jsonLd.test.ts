import { describe, expect, it } from 'vitest';
import { buildGuideJsonLd, guideAbsoluteUrl } from './jsonLd';
import type { GuideContent } from './types';

const GUIDE: GuideContent = {
  country: 'DE',
  locale: 'de',
  slug: 'rechnung-pflichtangaben',
  title: 'Rechnung Pflichtangaben | Fakturcho',
  description: 'Was auf einer Rechnung stehen muss.',
  h1: 'Rechnung schreiben in Deutschland',
  answer: 'answer',
  lastReviewed: '2026-09-25',
  sections: [],
  faqHeading: 'Häufige Fragen',
  faq: [{ question: 'q', answer: [{ text: 'a' }] }],
  cta: { heading: 'CTA', body: [{ text: 'body' }] },
};

describe('guideAbsoluteUrl', () => {
  it('builds an absolute, locale-prefixed URL', () => {
    expect(guideAbsoluteUrl(GUIDE)).toBe(
      'https://www.fakturcho.com/de/guide/rechnung-pflichtangaben',
    );
  });

  it('does not prefix the bg locale', () => {
    expect(guideAbsoluteUrl({ ...GUIDE, locale: 'bg', slug: 'faktura' })).toBe(
      'https://www.fakturcho.com/guide/faktura',
    );
  });
});

describe('buildGuideJsonLd', () => {
  const json = buildGuideJsonLd(GUIDE, { homeLabel: 'Start', guidesLabel: 'Leitfäden' });
  const parsed = JSON.parse(json);

  it('produces exactly one Article and one BreadcrumbList, and never a FAQPage', () => {
    const types = parsed['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toEqual(['Article', 'BreadcrumbList']);
    expect(json).not.toContain('FAQPage');
  });

  it('shapes the Article with the guide headline, dates and organization refs', () => {
    const article = parsed['@graph'][0];
    expect(article.headline).toBe(GUIDE.h1);
    expect(article.description).toBe(GUIDE.description);
    expect(article.inLanguage).toBe('de');
    expect(article.datePublished).toBe('2026-09-25');
    expect(article.dateModified).toBe('2026-09-25');
    expect(article.author).toEqual({ '@id': 'https://www.fakturcho.com/#organization' });
    expect(article.publisher).toEqual({ '@id': 'https://www.fakturcho.com/#organization' });
    expect(article.mainEntityOfPage).toBe(guideAbsoluteUrl(GUIDE));
    expect(article.about).toEqual({ '@type': 'Country', name: 'Germany' });
    expect(article.isPartOf).toEqual({
      '@type': 'WebSite',
      '@id': 'https://www.fakturcho.com/#website',
    });
  });

  it('shapes the BreadcrumbList with at least Home, Guides and the guide title', () => {
    const breadcrumb = parsed['@graph'][1];
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb.itemListElement.length).toBeGreaterThanOrEqual(2);
    expect(breadcrumb.itemListElement[0]).toMatchObject({ position: 1, name: 'Start' });
    expect(breadcrumb.itemListElement[1]).toMatchObject({ position: 2, name: 'Leitfäden' });
    expect(breadcrumb.itemListElement.at(-1)).toMatchObject({
      name: GUIDE.h1,
      item: guideAbsoluteUrl(GUIDE),
    });
  });

  it('escapes < so the script tag can never be broken out of', () => {
    const withLt = buildGuideJsonLd(
      { ...GUIDE, description: 'a < b' },
      { homeLabel: 'Start', guidesLabel: 'Leitfäden' },
    );
    expect(withLt).not.toContain('<');
    expect(withLt).toContain('\\u003c');
  });
});
