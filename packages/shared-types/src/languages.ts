export const SUPPORTED_LOCALES = ['bg', 'en', 'de', 'fr', 'it', 'pl', 'ro'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

// Locales the public site and app UI actually serve. A locale is routable,
// shows in the switcher and gets a sitemap/hreflang entry only once it is
// listed here — adding one is a translator's one-line registry change once
// messages/<locale>.json exists.
export const PUBLISHED_LOCALES = [
  'bg',
  'en',
  'de',
  'fr',
  'it',
  'pl',
  'ro',
] as const satisfies readonly Locale[];

export function isPublishedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (PUBLISHED_LOCALES as readonly string[]).includes(value);
}

export const DOCUMENT_LANGUAGES = ['bg', 'en', 'de', 'fr', 'it', 'pl', 'ro'] as const;
export type DocumentLanguage = (typeof DOCUMENT_LANGUAGES)[number];

export function isDocumentLanguage(value: string | null | undefined): value is DocumentLanguage {
  return (DOCUMENT_LANGUAGES as readonly string[]).includes(value ?? '');
}

export const TARGET_COUNTRIES = ['BG', 'DE', 'FR', 'IT', 'PL', 'RO'] as const;
export type TargetCountry = (typeof TARGET_COUNTRIES)[number];
