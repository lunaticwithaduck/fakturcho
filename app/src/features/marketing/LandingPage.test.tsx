// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from './LandingPage';

vi.mock('next/image', () => ({
  default: ({ src, alt, priority: _priority, ...rest }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...rest} />
  ),
}));

afterEach(cleanup);

describe('LandingPage', () => {
  it('renders the Bulgarian copy unchanged by default', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Фактури, които отговарят на българските изисквания',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Какво можете да издавате' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Цени' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Често задавани въпроси' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Вход' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Създай акаунт' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Вход' }).getAttribute('href')).toBe('/login');
    expect(screen.getByRole('link', { name: 'Създай акаунт' }).getAttribute('href')).toBe(
      '/signup',
    );
    expect(screen.getByText('Общи условия')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Where is your business based?' })).toBeNull();
  });

  it('renders the English copy for locale="en" with English legal links', () => {
    render(<LandingPage locale="en" />);

    expect(
      screen.getByRole('heading', { name: 'Compliant invoices for any EU business' }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'What you can issue' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Frequently asked questions' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create account' })).toBeTruthy();
    expect(screen.getByText('Terms of Service')).toBeTruthy();
    expect(screen.getByText('Terms of Service').getAttribute('href')).toBe('/en/terms');
    expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/en/login');
    expect(screen.getByRole('link', { name: 'Create account' }).getAttribute('href')).toBe(
      '/en/signup',
    );

    expect(screen.getByRole('heading', { name: 'Where is your business based?' })).toBeTruthy();
    const countries = [
      ['BG', 'Bulgaria'],
      ['DE', 'Germany'],
      ['FR', 'France'],
      ['IT', 'Italy'],
      ['PL', 'Poland'],
      ['RO', 'Romania'],
      ['ES', 'Spain'],
    ] as const;
    for (const [code, name] of countries) {
      expect(screen.getByRole('heading', { name })).toBeTruthy();
      expect(
        screen.getByRole('link', { name: `Create account — ${name}` }).getAttribute('href'),
      ).toBe(`/en/signup?country=${code}`);
    }
  });

  it('hides the language switcher when EN_LOCALE is off', () => {
    render(<LandingPage />);
    expect(screen.queryByRole('navigation', { name: 'Избор на език' })).toBeNull();
  });

  it('shows the switcher linking off the bg homepage when enabled', () => {
    render(<LandingPage enEnabled />);
    expect(screen.getByRole('link', { name: 'Български' }).getAttribute('href')).toBe('/?lang=bg');
    expect(screen.getByRole('link', { name: 'English' }).getAttribute('href')).toBe('/?lang=en');
  });

  it('shows the switcher linking off the en homepage when enabled', () => {
    render(<LandingPage locale="en" enEnabled />);
    expect(screen.getByRole('link', { name: 'Български' }).getAttribute('href')).toBe(
      '/en?lang=bg',
    );
    expect(screen.getByRole('link', { name: 'English' }).getAttribute('href')).toBe('/en?lang=en');
  });
});
