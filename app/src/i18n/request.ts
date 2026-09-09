import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, loadMessages } from './locale';

/**
 * Stays static: any dynamic API here (cookies/headers) forces the whole app
 * dynamic, since this is the single root layout for marketing, legal and app
 * routes alike. Real per-user locale is resolved client-side in
 * `LocaleProvider`, which overrides this default after mount.
 */
export async function buildRequestConfig() {
  return {
    locale: DEFAULT_LOCALE,
    messages: await loadMessages(DEFAULT_LOCALE),
  };
}

export default getRequestConfig(buildRequestConfig);
