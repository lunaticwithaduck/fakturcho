import type { Locale } from '@shared/types';
import { getCountryConfig } from '@shared/types';

export const TARGET_COUNTRIES = ['BG', 'DE', 'AT', 'FR', 'IT', 'PL', 'RO'] as const;
export type TargetCountry = (typeof TARGET_COUNTRIES)[number];

// The signup country picker preselects the one target country whose own
// language is this locale — nothing once a locale has no natural country
// (en) or the country's language isn't published yet.
export function defaultCountryForLocale(locale: Locale): TargetCountry | undefined {
  return TARGET_COUNTRIES.find((country) => getCountryConfig(country).locale === locale);
}
