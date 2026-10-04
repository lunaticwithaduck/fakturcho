// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import SignupPage, { generateMetadata } from './page';

describe('SignupPage metadata', () => {
  it('carries the Bulgarian canonical and every published-locale alternate', async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata.title).toBe('Регистрация');
    expect(metadata.alternates?.canonical).toBe('/signup');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/signup',
      en: '/en/signup',
      de: '/de/signup',
      fr: '/fr/signup',
      it: '/it/signup',
      pl: '/pl/signup',
      ro: '/ro/signup',
      'x-default': '/signup',
    });
  });

  it('drops the alternates on a query-string variant', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ country: 'DE' }),
    });
    expect(metadata.alternates).toEqual({ canonical: '/signup' });
  });
});

describe('SignupPage', () => {
  it('puts the form first and the landing highlights after it', async () => {
    const element = await SignupPage();
    const [form, highlights] = element.props.children;
    expect(form.type.name).toBe('SignupForm');
    expect(highlights.type.name).toBe('SignupHighlights');
    expect(highlights.props.faq.items.length).toBeGreaterThan(0);
  });
});
