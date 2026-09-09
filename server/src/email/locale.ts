export type Locale = 'bg' | 'en';

// Mirrors getCountryConfig(country).locale in packages/shared-types/src/countries.ts,
// which is not part of that package's public export surface (src/index.ts only
// re-exports documents/enums/etc, not countries). Duplicated here rather than
// crossing into shared-types from this lane.
function localeForCountry(country: string): Locale {
  return country === 'BG' ? 'bg' : 'en';
}

export function resolveEmailLocale(
  documentLanguage: string | null,
  issuerCountry: string | null,
  recipientCountry: string | null,
): Locale {
  if (documentLanguage === 'bg' || documentLanguage === 'en') return documentLanguage;
  if (issuerCountry) return localeForCountry(issuerCountry);
  if (recipientCountry) return localeForCountry(recipientCountry);
  return 'bg';
}
