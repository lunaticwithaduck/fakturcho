// @vitest-environment jsdom
import { PUBLISHED_LOCALES } from '@shared/types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LanguageMenu } from './LanguageMenu';

afterEach(cleanup);

function open(name: string) {
  fireEvent.keyDown(screen.getByRole('button', { name }), { key: 'Enter' });
}

describe('LanguageMenu', () => {
  it('renders nothing when disabled', () => {
    const { container } = render(<LanguageMenu locale="bg" currentPath="/" enabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('keeps the language links out of the page until the button is used', () => {
    render(<LanguageMenu locale="bg" currentPath="/" enabled={true} />);
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    expect(document.querySelectorAll('a[href*="lang="]')).toHaveLength(0);
  });

  it('lists one plain link per published locale off the current path', () => {
    render(<LanguageMenu locale="bg" currentPath="/" enabled={true} />);
    open('Избор на език: Български');

    expect(screen.getAllByRole('menuitem')).toHaveLength(PUBLISHED_LOCALES.length);
    const bg = screen.getByRole('menuitem', { name: 'Български' });
    const en = screen.getByRole('menuitem', { name: 'English' });
    expect(bg.tagName).toBe('A');
    expect(bg.getAttribute('href')).toBe('/?lang=bg');
    expect(en.getAttribute('href')).toBe('/?lang=en');
    expect(bg.getAttribute('aria-current')).toBe('true');
    expect(en.getAttribute('aria-current')).toBeNull();
  });

  it('links off the en homepage', () => {
    render(<LanguageMenu locale="en" currentPath="/en" enabled={true} />);
    open('Language: English');

    expect(screen.getByRole('menuitem', { name: 'Deutsch' }).getAttribute('href')).toBe(
      '/en?lang=de',
    );
    expect(screen.getByRole('menuitem', { name: 'English' }).getAttribute('aria-current')).toBe(
      'true',
    );
  });
});
