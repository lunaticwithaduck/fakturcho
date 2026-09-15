import type { Locale } from '@fakturcho/shared-types';
import { SUPPORTED_LOCALES } from '@fakturcho/shared-types';

export const DEFAULT_LOCALE: Locale = 'bg';
export const LOCALE_HEADER = 'x-locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function localeForPathname(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : DEFAULT_LOCALE;
}

export async function loadMessages(locale: Locale) {
  return (await import(`../../messages/${locale}.json`)).default;
}
