import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import { GUIDE_MODULES } from './content';
import type { GuideContent } from './types';

// First occurrence in `guides` wins a single-value key. A country can now
// publish more than one guide (one per app language, e.g. AT) without
// disturbing an existing "flagship" mapping — GUIDE_MODULES lists each
// original one-guide-per-locale country first, so DE's own guide stays
// guideForLocale('de') and guideForTargetCountry('DE') even once an AT guide
// in German joins the same locale.
function firstByKey<T>(items: readonly T[], key: (item: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, item);
  }
  return map;
}

export function buildRegistry(guides: readonly GuideContent[]) {
  const byCountry = firstByKey(guides, (guide) => guide.country);
  const byLocale = firstByKey(guides, (guide) => guide.locale);
  const byLocaleSlug = firstByKey(guides, (guide) => `${guide.locale}/${guide.slug}`);

  return {
    allGuides(): readonly GuideContent[] {
      return guides;
    },
    guidesForLocale(locale: Locale): readonly GuideContent[] {
      return guides.filter((guide) => guide.locale === locale);
    },
    getGuide(locale: Locale, slug: string): GuideContent | undefined {
      return byLocaleSlug.get(`${locale}/${slug}`);
    },
    guideForLocale(locale: Locale): GuideContent | undefined {
      return byLocale.get(locale);
    },
    euGuide(): GuideContent | undefined {
      return byCountry.get('EU');
    },
    guideForTargetCountry(country: string): GuideContent | undefined {
      return byCountry.get(country);
    },
    guideForIssuerCountry(country: string | null | undefined): GuideContent | undefined {
      if (country) {
        const guide = byCountry.get(country);
        if (guide) return guide;
      }
      return byCountry.get('EU');
    },
  };
}

const registry = buildRegistry(GUIDE_MODULES);

export const allGuides = registry.allGuides;
export const guidesForLocale = registry.guidesForLocale;
export const getGuide = registry.getGuide;
export const guideForLocale = registry.guideForLocale;
export const euGuide = registry.euGuide;
export const guideForTargetCountry = registry.guideForTargetCountry;
export const guideForIssuerCountry = registry.guideForIssuerCountry;

export function guideHref(guide: GuideContent): string {
  return toLocalePath(`/guide/${guide.slug}`, guide.locale);
}
