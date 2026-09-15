import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { Locale } from '@shared/types';

function messagesFor(locale: Locale) {
  return locale === 'bg' ? bgMessages : enMessages;
}

export function getMarketingContent(locale: Locale) {
  return messagesFor(locale).marketing;
}

export function getCountriesContent(locale: Locale) {
  return messagesFor(locale).marketing.countries;
}
