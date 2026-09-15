import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isEnLocaleEnabled } from './i18n/enLocaleCache';
import { LOCALE_HEADER, localeForPathname } from './i18n/locale';
import {
  decideLocaleRedirect,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
} from './i18n/localeRedirect';

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, localeForPathname(request.nextUrl.pathname));

  const decision = decideLocaleRedirect({
    pathname: request.nextUrl.pathname,
    searchParams: request.nextUrl.searchParams,
    acceptLanguage: request.headers.get('accept-language'),
    localeCookie: request.cookies.get(LOCALE_COOKIE_NAME)?.value ?? null,
    hasSession: request.cookies.getAll().some((cookie) => cookie.name.endsWith('session_token')),
    userAgent: request.headers.get('user-agent'),
    enEnabled: await isEnLocaleEnabled(),
  });

  if (decision.redirect) {
    const url = request.nextUrl.clone();
    url.pathname = decision.redirect.pathname;
    url.search = decision.redirect.search;
    const response = NextResponse.redirect(url, 307);
    if (decision.vary) response.headers.set('Vary', 'Accept-Language, Cookie');
    if (decision.setLocaleCookie) {
      response.cookies.set(LOCALE_COOKIE_NAME, decision.setLocaleCookie, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (decision.vary) response.headers.set('Vary', 'Accept-Language, Cookie');
  return response;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
