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

  it('links the en homepage to the EU overview guide', () => {
    render(<LandingPage locale="en" />);
    const links = screen.getAllByRole('link', { name: 'Invoicing guide' });
    expect(links[0]?.getAttribute('href')).toBe('/en/guide/eu-vat-invoice-requirements');
  });

  it('links the bg homepage to the Bulgarian guide', () => {
    render(<LandingPage />);
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/guide/faktura-zadalzhitelni-rekviziti-zdds');
  });

  it('hides the language button when EN_LOCALE is off', () => {
    render(<LandingPage />);
    expect(screen.queryByRole('button', { name: /Избор на език/ })).toBeNull();
  });

  it('shows the language button with the current language on the bg homepage', () => {
    render(<LandingPage enEnabled />);
    const button = screen.getByRole('button', { name: 'Избор на език: Български' });
    expect(button.textContent).toContain('Български');
  });

  it('shows the language button with the current language on the en homepage', () => {
    render(<LandingPage locale="en" enEnabled />);
    const button = screen.getByRole('button', { name: 'Language: English' });
    expect(button.textContent).toContain('English');
  });
});
