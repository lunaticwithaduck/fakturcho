import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { LOCALE_HEADER, localeForPathname } from './i18n/locale';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, localeForPathname(request.nextUrl.pathname));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
