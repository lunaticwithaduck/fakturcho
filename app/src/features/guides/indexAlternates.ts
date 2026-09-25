import { toLocalePath } from '@app/i18n/localeRedirect';
import { allGuides } from './registry';

export function guideIndexLocales() {
  return [...new Set(allGuides().map((guide) => guide.locale))];
}

export function guideIndexAlternates(): Record<string, string> {
  const locales = guideIndexLocales();
  if (locales.length === 0) return {};
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, toLocalePath('/guide', locale)])),
    'x-default': '/guide',
  };
}

export function latestGuideReview(): string | undefined {
  return allGuides()
    .map((guide) => guide.lastReviewed)
    .sort()
    .at(-1);
}
