import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clientIpFromHeaders, isBulgarianIp } from './i18n/bgIp';
import { isEnLocaleEnabled } from './i18n/enLocaleCache';
import { LOCALE_HEADER, localeForPathname } from './i18n/locale';
import {
  decideLocaleRedirect,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
} from './i18n/localeRedirect';

const APEX_HOST = 'fakturcho.com';
const CANONICAL_ORIGIN = 'https://www.fakturcho.com';

// Done here rather than in next.config redirects(): Next skips headers() for
// those responses, and a preloaded HSTS domain must send the header from the
// bare domain too. The matcher below hands this function every apex path.
function redirectApexToWww(request: NextRequest): NextResponse | null {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (host !== APEX_HOST) return null;
  const { pathname, search } = request.nextUrl;
  return new NextResponse(null, {
    status: 308,
    headers: { Location: `${CANONICAL_ORIGIN}${pathname === '/' ? '' : pathname}${search}` },
  });
}

export async function middleware(request: NextRequest) {
  const apexRedirect = redirectApexToWww(request);
  if (apexRedirect) return apexRedirect;

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
    clientIsBulgarian: isBulgarianIp(clientIpFromHeaders(request.headers)),
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
  matcher: [
    '/((?!_next|api|.*\\..*).*)',
    {
      source: '/((?!_next/static|_next/image).*)',
      has: [{ type: 'host', value: 'fakturcho.com' }],
    },
  ],
};
