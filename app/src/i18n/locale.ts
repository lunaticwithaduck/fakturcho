import type { Locale } from '@fakturcho/shared-types';
import { isPublishedLocale, PUBLISHED_LOCALES } from '@fakturcho/shared-types';

export const DEFAULT_LOCALE: Locale = 'bg';
export const LOCALE_HEADER = 'x-locale';

// A locale is only ever routable, and only ever has a messages file, once it
// is published — see PUBLISHED_LOCALES.
export const isLocale = isPublishedLocale;

// The set that drives the [locale] route tree: every published locale except
// the one bg already owns at the root.
export const NON_DEFAULT_PUBLISHED_LOCALES = PUBLISHED_LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);

export function localeForPathname(pathname: string): Locale {
  for (const locale of NON_DEFAULT_PUBLISHED_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return locale;
  }
  return DEFAULT_LOCALE;
}

export async function loadMessages(locale: Locale) {
  return (await import(`../../messages/${locale}.json`)).default;
}
