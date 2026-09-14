import type { MeDto } from '@shared/types';
import { API_ROUTES } from '@shared/types';
import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { getFeatureFlags } from '../feature-flags';
import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, loadMessages } from './locale';

async function resolveSessionLocale() {
  const flags = await getFeatureFlags();
  if (!flags.EN_LOCALE) return null;

  try {
    const store = await cookies();
    const entries = store.getAll();
    if (!entries.some((entry) => entry.name.endsWith('session_token'))) return null;
    const cookieHeader = entries.map((entry) => `${entry.name}=${entry.value}`).join('; ');

    const serverUrl = process.env.SERVER_URL ?? 'http://localhost:3001';
    const response = await fetch(`${serverUrl}${API_ROUTES.me}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const me = (await response.json()) as Partial<MeDto> | null;
    return isLocale(me?.locale) && me.locale !== DEFAULT_LOCALE ? me.locale : null;
  } catch {
    return null;
  }
}

export async function buildRequestConfig() {
  const headerLocale = (await headers()).get(LOCALE_HEADER);
  const pathLocale = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const locale =
    pathLocale === DEFAULT_LOCALE ? ((await resolveSessionLocale()) ?? pathLocale) : pathLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
}

export default getRequestConfig(buildRequestConfig);
