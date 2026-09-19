import type { Locale } from '@shared/types';
import { PUBLISHED_LOCALES } from '@shared/types';
import { DEFAULT_LOCALE, isLocale, NON_DEFAULT_PUBLISHED_LOCALES } from './locale';

export const LOCALE_COOKIE_NAME = 'fakturcho_locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const LOCALE_QUERY_PARAM = 'lang';

const PUBLIC_BASE_PATHS = ['/', '/login', '/signup', '/privacy', '/terms', '/refunds'] as const;

const BOT_UA_REGEX = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse/i;

export function toBasePath(pathname: string): string {
  for (const locale of NON_DEFAULT_PUBLISHED_LOCALES) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

export function toLocalePath(basePath: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return basePath;
  return basePath === '/' ? `/${locale}` : `/${locale}${basePath}`;
}

export function hreflangAlternates(basePath: string): Record<string, string> {
  const entries = PUBLISHED_LOCALES.map((locale) => [locale, toLocalePath(basePath, locale)]);
  return { ...Object.fromEntries(entries), 'x-default': basePath };
}

function isPublicPath(pathname: string): boolean {
  return (PUBLIC_BASE_PATHS as readonly string[]).includes(toBasePath(pathname));
}

function isBgEntryPath(pathname: string): boolean {
  return (PUBLIC_BASE_PATHS as readonly string[]).includes(pathname);
}

function searchString(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function topLanguagePrimarySubtag(header: string | null): string | null {
  if (!header || header.trim() === '') return null;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag: tag?.trim() ?? '', q: Number.isNaN(q) ? 0 : q };
    })
    .filter((entry) => entry.tag && entry.tag !== '*')
    .sort((a, b) => b.q - a.q);
  const top = ranked[0];
  if (!top) return null;
  return top.tag.split('-')[0]?.toLowerCase() || null;
}

export interface LocaleRedirectInput {
  pathname: string;
  searchParams: URLSearchParams;
  acceptLanguage: string | null;
  localeCookie: string | null;
  hasSession: boolean;
  userAgent: string | null;
  enEnabled: boolean;
  clientIsBulgarian: boolean;
}

export interface LocaleRedirectDecision {
  redirect: { pathname: string; search: string } | null;
  setLocaleCookie: Locale | null;
  vary: boolean;
}

const NO_OP: LocaleRedirectDecision = { redirect: null, setLocaleCookie: null, vary: false };

export function decideLocaleRedirect(input: LocaleRedirectInput): LocaleRedirectDecision {
  const {
    pathname,
    searchParams,
    acceptLanguage,
    localeCookie,
    hasSession,
    userAgent,
    enEnabled,
    clientIsBulgarian,
  } = input;

  if (!isPublicPath(pathname)) return NO_OP;

  const langParam = searchParams.get(LOCALE_QUERY_PARAM);
  if (langParam && isLocale(langParam) && (langParam === DEFAULT_LOCALE || enEnabled)) {
    const target = langParam;
    const newPath = toLocalePath(toBasePath(pathname), target);
    const remaining = new URLSearchParams(searchParams);
    remaining.delete(LOCALE_QUERY_PARAM);
    return {
      redirect: { pathname: newPath, search: searchString(remaining) },
      setLocaleCookie: target,
      vary: true,
    };
  }

  if (!enEnabled || hasSession) {
    return { redirect: null, setLocaleCookie: null, vary: true };
  }
  if (userAgent && BOT_UA_REGEX.test(userAgent)) {
    return { redirect: null, setLocaleCookie: null, vary: true };
  }

  if (!isBgEntryPath(pathname)) {
    if (clientIsBulgarian && !isLocale(localeCookie)) {
      return {
        redirect: { pathname: toBasePath(pathname), search: searchString(searchParams) },
        setLocaleCookie: null,
        vary: true,
      };
    }
    return { redirect: null, setLocaleCookie: null, vary: true };
  }

  if (isLocale(localeCookie)) {
    if (localeCookie !== DEFAULT_LOCALE) {
      return {
        redirect: {
          pathname: toLocalePath(pathname, localeCookie),
          search: searchString(searchParams),
        },
        setLocaleCookie: null,
        vary: true,
      };
    }
    return { redirect: null, setLocaleCookie: null, vary: true };
  }

  if (clientIsBulgarian) {
    return { redirect: null, setLocaleCookie: null, vary: true };
  }

  const topLang = topLanguagePrimarySubtag(acceptLanguage);
  if (!topLang || topLang === DEFAULT_LOCALE) {
    return { redirect: null, setLocaleCookie: null, vary: true };
  }
  const target = isLocale(topLang) ? topLang : 'en';
  return {
    redirect: { pathname: toLocalePath(pathname, target), search: searchString(searchParams) },
    setLocaleCookie: null,
    vary: true,
  };
}
