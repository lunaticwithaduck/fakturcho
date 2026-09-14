import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, loadMessages } from './locale';

export async function buildRequestConfig() {
  const headerLocale = (await headers()).get(LOCALE_HEADER);
  const locale = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  return {
    locale,
    messages: await loadMessages(locale),
  };
}

export default getRequestConfig(buildRequestConfig);
