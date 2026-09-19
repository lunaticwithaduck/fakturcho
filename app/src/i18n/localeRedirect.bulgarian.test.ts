import { describe, expect, it } from 'vitest';
import { decideLocaleRedirect, type LocaleRedirectInput } from './localeRedirect';

function input(overrides: Partial<LocaleRedirectInput> = {}): LocaleRedirectInput {
  return {
    pathname: '/',
    searchParams: new URLSearchParams(),
    acceptLanguage: 'en-US,en;q=0.9',
    localeCookie: null,
    hasSession: false,
    userAgent: 'Mozilla/5.0',
    enEnabled: true,
    clientIsBulgarian: true,
    ...overrides,
  };
}

describe('decideLocaleRedirect — visitor on a Bulgarian IP', () => {
  it.each(['en-US,en;q=0.9', 'de', 'ja', 'bg;q=0.5,en;q=0.9'])(
    'stays on the Bulgarian page with Accept-Language %s',
    (acceptLanguage) => {
      const decision = decideLocaleRedirect(input({ acceptLanguage }));
      expect(decision.redirect).toBeNull();
      expect(decision.vary).toBe(true);
    },
  );

  it.each([
    ['/en', '/'],
    ['/de', '/'],
    ['/en/signup', '/signup'],
    ['/en/privacy', '/privacy'],
  ])('is sent from %s to %s', (pathname, expected) => {
    const decision = decideLocaleRedirect(input({ pathname }));
    expect(decision.redirect?.pathname).toBe(expected);
    expect(decision.setLocaleCookie).toBeNull();
  });

  it('keeps the query string on the way back', () => {
    const decision = decideLocaleRedirect(
      input({ pathname: '/en/signup', searchParams: new URLSearchParams('plan=pro&ref=a') }),
    );
    expect(decision.redirect).toEqual({ pathname: '/signup', search: '?plan=pro&ref=a' });
  });

  it('honours a language picked in the switcher', () => {
    const picked = decideLocaleRedirect(input({ searchParams: new URLSearchParams('lang=en') }));
    expect(picked.redirect?.pathname).toBe('/en');
    expect(picked.setLocaleCookie).toBe('en');

    expect(
      decideLocaleRedirect(input({ pathname: '/en', localeCookie: 'en' })).redirect,
    ).toBeNull();
    expect(decideLocaleRedirect(input({ localeCookie: 'en' })).redirect?.pathname).toBe('/en');
  });

  it('leaves an explicit /en visit alone once Bulgarian was picked', () => {
    const decision = decideLocaleRedirect(input({ pathname: '/en', localeCookie: 'bg' }));
    expect(decision.redirect).toBeNull();
  });

  it('leaves crawlers on /en', () => {
    const decision = decideLocaleRedirect(input({ pathname: '/en', userAgent: 'Googlebot/2.1' }));
    expect(decision.redirect).toBeNull();
  });

  it('leaves signed-in users on /en', () => {
    const decision = decideLocaleRedirect(input({ pathname: '/en', hasSession: true }));
    expect(decision.redirect).toBeNull();
  });

  it('leaves /en alone while the English locale is switched off', () => {
    const decision = decideLocaleRedirect(input({ pathname: '/en', enEnabled: false }));
    expect(decision.redirect).toBeNull();
  });

  it('never touches an app route', () => {
    const decision = decideLocaleRedirect(input({ pathname: '/documents' }));
    expect(decision).toEqual({ redirect: null, setLocaleCookie: null, vary: false });
  });
});

describe('decideLocaleRedirect — visitor outside Bulgaria', () => {
  it('still follows Accept-Language', () => {
    const decision = decideLocaleRedirect(input({ clientIsBulgarian: false }));
    expect(decision.redirect?.pathname).toBe('/en');
  });

  it('stays on /en', () => {
    const decision = decideLocaleRedirect(input({ clientIsBulgarian: false, pathname: '/en' }));
    expect(decision.redirect).toBeNull();
  });
});
