import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import { PUBLISHED_LOCALES } from '@shared/types';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.fakturcho.com';

function absoluteAlternates(basePath: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(hreflangAlternates(basePath)).map(([locale, path]) => [
      locale,
      `${BASE_URL}${path}`,
    ]),
  );
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
    url: `${BASE_URL}${toLocalePath(basePath, locale)}`,
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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localizedEntries('/', 'weekly', 1),
    ...localizedEntries('/signup', 'weekly', 0.8),
    ...legalEntries('/privacy'),
    ...legalEntries('/terms'),
    ...legalEntries('/refunds'),
  ];
}
