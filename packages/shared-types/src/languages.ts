export const SUPPORTED_LOCALES = ['bg', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DOCUMENT_LANGUAGES = ['bg', 'en', 'de', 'fr', 'it', 'pl', 'ro', 'es'] as const;
export type DocumentLanguage = (typeof DOCUMENT_LANGUAGES)[number];

export function isDocumentLanguage(value: string | null | undefined): value is DocumentLanguage {
  return (DOCUMENT_LANGUAGES as readonly string[]).includes(value ?? '');
}

export const TARGET_COUNTRIES = ['BG', 'DE', 'FR', 'IT', 'PL', 'RO', 'ES'] as const;
export type TargetCountry = (typeof TARGET_COUNTRIES)[number];
