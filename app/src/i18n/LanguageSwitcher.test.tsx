// @vitest-environment jsdom
import { PUBLISHED_LOCALES } from '@shared/types';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LanguageSwitcher } from './LanguageSwitcher';

afterEach(cleanup);

describe('LanguageSwitcher', () => {
  it('renders nothing when disabled', () => {
    const { container } = render(
      <LanguageSwitcher locale="bg" currentPath="/login" enabled={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders one link per published locale, all off the current path', () => {
    render(<LanguageSwitcher locale="bg" currentPath="/login" enabled={true} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(PUBLISHED_LOCALES.length);

    const bg = screen.getByRole('link', { name: 'Български' });
    const en = screen.getByRole('link', { name: 'English' });
    expect(bg.getAttribute('href')).toBe('/login?lang=bg');
    expect(en.getAttribute('href')).toBe('/login?lang=en');
    expect(bg.getAttribute('aria-current')).toBe('true');
    expect(en.getAttribute('aria-current')).toBeNull();
  });

  it('marks en as current and preserves the currentPath for /en routes', () => {
    render(<LanguageSwitcher locale="en" currentPath="/en/terms" enabled={true} />);

    const bg = screen.getByRole('link', { name: 'Български' });
    const en = screen.getByRole('link', { name: 'English' });
    expect(bg.getAttribute('href')).toBe('/en/terms?lang=bg');
    expect(en.getAttribute('href')).toBe('/en/terms?lang=en');
    expect(en.getAttribute('aria-current')).toBe('true');
    expect(bg.getAttribute('aria-current')).toBeNull();
  });

  it('exposes a locale-appropriate accessible group label', () => {
    render(<LanguageSwitcher locale="bg" currentPath="/" enabled={true} />);
    expect(screen.getByRole('navigation', { name: 'Избор на език' })).toBeTruthy();
  });

  it('labels the group in the viewer language for a non-bg locale', () => {
    render(<LanguageSwitcher locale="en" currentPath="/en" enabled={true} />);
    expect(screen.getByRole('navigation', { name: 'Language' })).toBeTruthy();
  });
});
