import type { Locale } from '@shared/types';
import { PUBLISHED_LOCALES } from '@shared/types';

const OG_LOCALE_TAGS: Record<Locale, string> = {
  bg: 'bg_BG',
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  it: 'it_IT',
  pl: 'pl_PL',
  ro: 'ro_RO',
  es: 'es_ES',
};

export function ogLocaleTag(locale: Locale): string {
  return OG_LOCALE_TAGS[locale];
}

export function ogLocaleAlternates(locale: Locale): string[] {
  return PUBLISHED_LOCALES.filter((published) => published !== locale).map(ogLocaleTag);
}
