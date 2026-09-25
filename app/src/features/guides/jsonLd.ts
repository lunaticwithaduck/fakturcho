import { toLocalePath } from '@app/i18n/localeRedirect';
import { GUIDE_COUNTRY_NAMES } from './countryNames';
import type { GuideContent } from './types';

const BASE_URL = 'https://www.fakturcho.com';

export function guideAbsoluteUrl(guide: GuideContent): string {
  return `${BASE_URL}${toLocalePath(`/guide/${guide.slug}`, guide.locale)}`;
}

export interface GuideJsonLdChrome {
  homeLabel: string;
  guidesLabel: string;
}

export function buildGuideJsonLd(guide: GuideContent, chrome: GuideJsonLdChrome): string {
  const url = guideAbsoluteUrl(guide);
  const article = {
    '@type': 'Article',
    headline: guide.h1,
    description: guide.description,
    inLanguage: guide.locale,
    datePublished: guide.lastReviewed,
    dateModified: guide.lastReviewed,
    author: { '@id': `${BASE_URL}/#organization` },
    publisher: { '@id': `${BASE_URL}/#organization` },
    mainEntityOfPage: url,
    about: { '@type': 'Country', name: GUIDE_COUNTRY_NAMES[guide.country] },
    isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
  };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: chrome.homeLabel,
        item: `${BASE_URL}${toLocalePath('/', guide.locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: chrome.guidesLabel,
        item: `${BASE_URL}${toLocalePath('/guide', guide.locale)}`,
      },
      { '@type': 'ListItem', position: 3, name: guide.h1, item: url },
    ],
  };
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [article, breadcrumb],
  }).replace(/</g, '\\u003c');
}
