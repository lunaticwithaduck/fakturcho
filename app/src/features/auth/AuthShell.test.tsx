// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthShell } from './AuthShell';

vi.mock('next/image', () => ({
  default: ({ src, alt, priority: _priority, ...rest }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...rest} />
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/login'),
}));

afterEach(cleanup);

describe('AuthShell', () => {
  it('renders the Bulgarian brand and links home to / by default', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <AuthShell>
          <p>content</p>
        </AuthShell>
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Фактурчо')).toBeTruthy();
    expect(screen.getByText('Фактурчо').closest('a')).toHaveProperty(
      'href',
      'http://localhost:3000/',
    );
  });

  it('renders the English brand and links home to /en for locale="en"', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <AuthShell locale="en">
          <p>content</p>
        </AuthShell>
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Fakturcho')).toBeTruthy();
    expect(screen.getByText('Fakturcho').closest('a')).toHaveProperty(
      'href',
      'http://localhost:3000/en',
    );
    expect(screen.getByText('Terms of Service').getAttribute('href')).toBe('/en/terms');
  });

  it('hides the language switcher when EN_LOCALE is off', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <AuthShell>
          <p>content</p>
        </AuthShell>
      </NextIntlClientProvider>,
    );

    expect(screen.queryByRole('navigation', { name: 'Избор на език' })).toBeNull();
  });

  it('shows the switcher linking to the current path when enabled', () => {
    vi.mocked(usePathname).mockReturnValue('/login');
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <AuthShell enEnabled>
          <p>content</p>
        </AuthShell>
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Български' }).getAttribute('href')).toBe(
      '/login?lang=bg',
    );
    expect(screen.getByRole('link', { name: 'Английски' }).getAttribute('href')).toBe(
      '/login?lang=en',
    );
  });

  it('links the switcher off /en/signup when rendered for the English shell', () => {
    vi.mocked(usePathname).mockReturnValue('/en/signup');
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <AuthShell locale="en" enEnabled>
          <p>content</p>
        </AuthShell>
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'English' }).getAttribute('href')).toBe(
      '/en/signup?lang=en',
    );
    expect(screen.getByRole('link', { name: 'Bulgarian' }).getAttribute('href')).toBe(
      '/en/signup?lang=bg',
    );
  });
});
