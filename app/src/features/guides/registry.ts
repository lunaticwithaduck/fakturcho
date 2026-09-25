import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import { GUIDE_MODULES } from './content';
import type { GuideContent } from './types';

export function buildRegistry(guides: readonly GuideContent[]) {
  const byCountry = new Map<string, GuideContent>(guides.map((guide) => [guide.country, guide]));
  const byLocale = new Map(guides.map((guide) => [guide.locale, guide]));
  const byLocaleSlug = new Map(guides.map((guide) => [`${guide.locale}/${guide.slug}`, guide]));

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
