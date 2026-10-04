import { guideAlternates } from '@app/features/guides/guideAlternates';
import {
  guideIndexAlternates,
  guideIndexLocales,
  latestGuideReview,
} from '@app/features/guides/indexAlternates';
import { allGuides, guideHref } from '@app/features/guides/registry';
import type { GuideContent } from '@app/features/guides/types';
import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import { PUBLISHED_LOCALES } from '@shared/types';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.fakturcho.com';

function absoluteUrl(path: string): string {
  return path === '/' ? BASE_URL : `${BASE_URL}${path}`;
}

function absoluteUrls(paths: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(paths).map(([locale, path]) => [locale, absoluteUrl(path)]),
  );
}

function absoluteAlternates(basePath: string): Record<string, string> {
  return absoluteUrls(hreflangAlternates(basePath));
}

// Home and signup have real per-locale content, so every published
// locale gets its own sitemap entry. Legal pages are pure English proxies
// (see [locale]/privacy|terms|refunds) and are never worth listing per
// locale — only the bg original and the canonical /en copy are.
function localizedEntries(
  basePath: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
): MetadataRoute.Sitemap {
  const alternates = { languages: absoluteAlternates(basePath) };
  return PUBLISHED_LOCALES.map((locale) => ({
    url: absoluteUrl(toLocalePath(basePath, locale)),
    changeFrequency,
    priority,
    alternates,
  }));
}

function legalEntries(basePath: string): MetadataRoute.Sitemap {
  const alternates = {
    languages: {
      bg: `${BASE_URL}${basePath}`,
      en: `${BASE_URL}/en${basePath}`,
      'x-default': `${BASE_URL}${basePath}`,
    },
  };
  return [
    { url: `${BASE_URL}${basePath}`, changeFrequency: 'yearly', priority: 0.3, alternates },
    { url: `${BASE_URL}/en${basePath}`, changeFrequency: 'yearly', priority: 0.3, alternates },
  ];
}

function guideUrl(guide: GuideContent): string {
  return `${BASE_URL}${guideHref(guide)}`;
}

function guideEntries(): MetadataRoute.Sitemap {
  return allGuides().map((guide) => {
    const languages = guideAlternates(guide);
    return {
      url: guideUrl(guide),
      lastModified: guide.lastReviewed,
      changeFrequency: 'monthly',
      priority: 0.6,
      ...(languages ? { alternates: { languages: absoluteUrls(languages) } } : {}),
    };
  });
}

function guideIndexEntries(): MetadataRoute.Sitemap {
  const languages = absoluteUrls(guideIndexAlternates());
  const lastModified = latestGuideReview();
  return guideIndexLocales().map((locale) => ({
    url: `${BASE_URL}${toLocalePath('/guide', locale)}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: 'monthly',
    priority: 0.5,
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localizedEntries('/', 'weekly', 1),
    ...localizedEntries('/signup', 'weekly', 0.8),
    ...legalEntries('/privacy'),
    ...legalEntries('/terms'),
    ...legalEntries('/refunds'),
    ...guideEntries(),
    ...guideIndexEntries(),
  ];
}
