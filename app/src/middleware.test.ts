import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { LOCALE_HEADER } from './i18n/locale';
import { middleware } from './middleware';

function request(pathname: string) {
  return new NextRequest(new URL(pathname, 'https://www.fakturcho.com'));
}

describe('middleware', () => {
  it('tags an /en request with the en locale header', () => {
    const response = middleware(request('/en/signup'));

    expect(response.headers.get('x-middleware-request-x-locale')).toBe('en');
  });

  it('tags every other request with the bg locale header', () => {
    const response = middleware(request('/documents'));

    expect(response.headers.get('x-middleware-request-x-locale')).toBe('bg');
  });

  it('uses the shared locale header name', () => {
    expect(LOCALE_HEADER).toBe('x-locale');
  });
});
