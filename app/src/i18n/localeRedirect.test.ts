import { describe, expect, it } from 'vitest';
import { decideLocaleRedirect, type LocaleRedirectInput } from './localeRedirect';

function input(overrides: Partial<LocaleRedirectInput> = {}): LocaleRedirectInput {
  return {
    pathname: '/',
    searchParams: new URLSearchParams(),
    acceptLanguage: null,
    localeCookie: null,
    hasSession: false,
    userAgent: 'Mozilla/5.0',
    enEnabled: true,
    clientIsBulgarian: false,
    ...overrides,
  };
}

describe('decideLocaleRedirect — auto redirect by Accept-Language', () => {
  it.each([
    ['bg', 'bg', null],
    ['bg-BG', 'bg', null],
    ['en-US', 'en-US', '/en'],
    ['de', 'de', '/de'],
    ['bg;q=0.5,en;q=0.9', 'bg;q=0.5,en;q=0.9', '/en'],
  ])('Accept-Language %s redirects to %s', (_label, header, expected) => {
    const decision = decideLocaleRedirect(input({ acceptLanguage: header }));
    expect(decision.redirect?.pathname ?? null).toBe(expected);
    expect(decision.vary).toBe(true);
  });

  it('does not redirect when the header is missing', () => {
    const decision = decideLocaleRedirect(input({ acceptLanguage: null }));
    expect(decision.redirect).toBeNull();
  });

  it('does not redirect when the header is empty', () => {
    const decision = decideLocaleRedirect(input({ acceptLanguage: '' }));
    expect(decision.redirect).toBeNull();
  });

  it('keeps the query string', () => {
    const decision = decideLocaleRedirect(
      input({
        pathname: '/signup',
        searchParams: new URLSearchParams('country=DE&utm_source=x'),
        acceptLanguage: 'de-DE',
      }),
    );
    expect(decision.redirect).toEqual({
      pathname: '/de/signup',
      search: '?country=DE&utm_source=x',
    });
  });
});

describe('decideLocaleRedirect — gates', () => {
  it('never redirects a crawler', () => {
    const decision = decideLocaleRedirect(
      input({ acceptLanguage: 'en-US', userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }),
    );
    expect(decision.redirect).toBeNull();
  });

  it('never redirects a signed-in visitor', () => {
    const decision = decideLocaleRedirect(input({ acceptLanguage: 'en-US', hasSession: true }));
    expect(decision.redirect).toBeNull();
  });

  it('never redirects when EN is disabled, regardless of header', () => {
    const decision = decideLocaleRedirect(input({ acceptLanguage: 'en-US', enEnabled: false }));
    expect(decision.redirect).toBeNull();
  });

  it('a bot with no session and en Accept-Language still does not redirect (both gates)', () => {
    const decision = decideLocaleRedirect(
      input({
        acceptLanguage: 'en-US',
        userAgent: 'lighthouse',
        hasSession: true,
      }),
    );
    expect(decision.redirect).toBeNull();
  });
});

describe('decideLocaleRedirect — locale cookie', () => {
  it('redirects when the cookie says en, even with a bg Accept-Language', () => {
    const decision = decideLocaleRedirect(input({ localeCookie: 'en', acceptLanguage: 'bg-BG' }));
    expect(decision.redirect?.pathname).toBe('/en');
  });

  it('does not redirect when the cookie says bg, even with an en Accept-Language', () => {
    const decision = decideLocaleRedirect(input({ localeCookie: 'bg', acceptLanguage: 'en-US' }));
    expect(decision.redirect).toBeNull();
  });

  it('both cookies present: session wins over an en locale cookie', () => {
    const decision = decideLocaleRedirect(input({ localeCookie: 'en', hasSession: true }));
    expect(decision.redirect).toBeNull();
  });

  it('ignores a garbage cookie value and falls back to Accept-Language', () => {
    const decision = decideLocaleRedirect(
      input({ localeCookie: 'garbage', acceptLanguage: 'en-US' }),
    );
    expect(decision.redirect?.pathname).toBe('/en');
  });
});

describe('decideLocaleRedirect — explicit lang param', () => {
  it('lang=en on a bg path redirects to the en path and sets the cookie', () => {
    const decision = decideLocaleRedirect(
      input({ pathname: '/login', searchParams: new URLSearchParams('lang=en') }),
    );
    expect(decision.redirect).toEqual({ pathname: '/en/login', search: '' });
    expect(decision.setLocaleCookie).toBe('en');
  });

  it('lang=bg on an en path redirects to the bg path and sets the cookie', () => {
    const decision = decideLocaleRedirect(
      input({ pathname: '/en/terms', searchParams: new URLSearchParams('lang=bg') }),
    );
    expect(decision.redirect).toEqual({ pathname: '/terms', search: '' });
    expect(decision.setLocaleCookie).toBe('bg');
  });

  it('preserves other query params and strips only lang', () => {
    const decision = decideLocaleRedirect(
      input({ pathname: '/signup', searchParams: new URLSearchParams('country=BG&lang=en') }),
    );
    expect(decision.redirect).toEqual({ pathname: '/en/signup', search: '?country=BG' });
  });

  it('ignores lang=en when EN is disabled', () => {
    const decision = decideLocaleRedirect(
      input({
        pathname: '/login',
        searchParams: new URLSearchParams('lang=en'),
        enEnabled: false,
      }),
    );
    expect(decision.redirect).toBeNull();
    expect(decision.setLocaleCookie).toBeNull();
  });

  it('honours lang=bg even when EN is disabled', () => {
    const decision = decideLocaleRedirect(
      input({
        pathname: '/en/login',
        searchParams: new URLSearchParams('lang=bg'),
        enEnabled: false,
      }),
    );
    expect(decision.redirect).toEqual({ pathname: '/login', search: '' });
    expect(decision.setLocaleCookie).toBe('bg');
  });

  it('takes precedence over the auto-redirect gates (session, crawler)', () => {
    const decision = decideLocaleRedirect(
      input({
        pathname: '/login',
        searchParams: new URLSearchParams('lang=en'),
        hasSession: true,
        userAgent: 'Googlebot',
      }),
    );
    expect(decision.redirect).toEqual({ pathname: '/en/login', search: '' });
  });
});

describe('decideLocaleRedirect — scope', () => {
  it('never touches an app route', () => {
    const decision = decideLocaleRedirect(
      input({
        pathname: '/documents',
        acceptLanguage: 'en-US',
        searchParams: new URLSearchParams('lang=en'),
      }),
    );
    expect(decision).toEqual({ redirect: null, setLocaleCookie: null, vary: false });
  });

  it('never auto-redirects away from an explicit /en URL', () => {
    const decision = decideLocaleRedirect(input({ pathname: '/en', acceptLanguage: 'bg-BG' }));
    expect(decision.redirect).toBeNull();
  });

  it('does not auto-redirect an /en subpath either', () => {
    const decision = decideLocaleRedirect(input({ pathname: '/en/privacy', acceptLanguage: 'de' }));
    expect(decision.redirect).toBeNull();
  });

  it('sets Vary on entry-path pass-throughs with no redirect', () => {
    const decision = decideLocaleRedirect(input({ acceptLanguage: 'bg' }));
    expect(decision.redirect).toBeNull();
    expect(decision.vary).toBe(true);
  });
});
