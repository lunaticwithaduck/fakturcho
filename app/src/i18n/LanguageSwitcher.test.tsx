// @vitest-environment jsdom
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

  it('links to the current path with each lang value, marking the current locale', () => {
    render(<LanguageSwitcher locale="bg" currentPath="/login" enabled={true} />);

    const bg = screen.getByRole('link', { name: 'Български' });
    const en = screen.getByRole('link', { name: 'Английски' });
    expect(bg.getAttribute('href')).toBe('/login?lang=bg');
    expect(en.getAttribute('href')).toBe('/login?lang=en');
    expect(bg.getAttribute('aria-current')).toBe('true');
    expect(en.getAttribute('aria-current')).toBeNull();
    expect(screen.getByText('БГ')).toBeTruthy();
    expect(screen.getByText('EN')).toBeTruthy();
  });

  it('marks en as current and preserves the currentPath for /en routes', () => {
    render(<LanguageSwitcher locale="en" currentPath="/en/terms" enabled={true} />);

    const bg = screen.getByRole('link', { name: 'Bulgarian' });
    const en = screen.getByRole('link', { name: 'English' });
    expect(bg.getAttribute('href')).toBe('/en/terms?lang=bg');
    expect(en.getAttribute('href')).toBe('/en/terms?lang=en');
    expect(en.getAttribute('aria-current')).toBe('true');
    expect(bg.getAttribute('aria-current')).toBeNull();
  });

  it('exposes an accessible group label', () => {
    render(<LanguageSwitcher locale="bg" currentPath="/" enabled={true} />);
    expect(screen.getByRole('navigation', { name: 'Избор на език' })).toBeTruthy();
  });
});
