// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegalShell } from './LegalShell';

vi.mock('next/image', () => ({
  default: ({ src, alt, priority: _priority, ...rest }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...rest} />
  ),
}));

afterEach(cleanup);

describe('LegalShell', () => {
  it('links the Bulgarian brand home and the Bulgarian guide index', () => {
    render(<LegalShell>body</LegalShell>);
    expect(screen.getByRole('link', { name: 'Фактурчо' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Наръчници' }).getAttribute('href')).toBe('/guide');
  });

  it('links the locale home, legal pages and guide index for a locale', () => {
    render(<LegalShell locale="de">body</LegalShell>);
    expect(screen.getByRole('link', { name: 'Fakturcho' }).getAttribute('href')).toBe('/de');
    expect(screen.getByRole('link', { name: 'Leitfäden' }).getAttribute('href')).toBe('/de/guide');
    expect(screen.getByText('body')).toBeTruthy();
  });
});
