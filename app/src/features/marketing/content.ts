import bgMessages from '@messages/bg.json';
import deMessages from '@messages/de.json';
import enMessages from '@messages/en.json';
import frMessages from '@messages/fr.json';
import itMessages from '@messages/it.json';
import plMessages from '@messages/pl.json';
import roMessages from '@messages/ro.json';
import type { Locale } from '@shared/types';

// bg.json has no top-level "seo" key (bg doesn't need generated SEO metadata),
// so this deliberately isn't typed as Record<Locale, typeof enMessages> —
// only .marketing, present in every locale, is ever read off it.
const MESSAGES_BY_LOCALE = {
  bg: bgMessages,
  en: enMessages,
  de: deMessages,
  fr: frMessages,
  it: itMessages,
  pl: plMessages,
  ro: roMessages,
};

function messagesFor(locale: Locale) {
  return MESSAGES_BY_LOCALE[locale];
}

export function getMarketingContent(locale: Locale) {
  return messagesFor(locale).marketing;
}

export function getCountriesContent(locale: Locale) {
  return messagesFor(locale).marketing.countries;
}
