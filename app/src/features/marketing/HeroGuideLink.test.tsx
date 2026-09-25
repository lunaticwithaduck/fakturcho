// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HeroGuideLink } from './HeroGuideLink';

const { guideForLocaleMock } = vi.hoisted(() => ({ guideForLocaleMock: vi.fn() }));

vi.mock('@app/features/guides/registry', () => ({
  guideForLocale: guideForLocaleMock,
  guideHref: () => '/de/guide/rechnung-pflichtangaben',
}));

afterEach(() => {
  cleanup();
  guideForLocaleMock.mockReset();
});

describe('HeroGuideLink', () => {
  it('renders nothing when the locale has no guide yet', () => {
    guideForLocaleMock.mockReturnValue(undefined);
    const { container } = render(<HeroGuideLink locale="de" label="Rechnungsleitfaden" />);
    expect(container.firstChild).toBeNull();
  });

  it('links to the locale guide when one exists', () => {
    guideForLocaleMock.mockReturnValue({ slug: 'rechnung-pflichtangaben', locale: 'de' });
    render(<HeroGuideLink locale="de" label="Rechnungsleitfaden" />);
    const link = screen.getByRole('link', { name: 'Rechnungsleitfaden' });
    expect(link.getAttribute('href')).toBe('/de/guide/rechnung-pflichtangaben');
  });
});
