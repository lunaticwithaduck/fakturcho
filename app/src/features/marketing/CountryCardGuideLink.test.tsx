// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CountryCardGuideLink } from './CountryCardGuideLink';

const { guideForTargetCountryMock } = vi.hoisted(() => ({ guideForTargetCountryMock: vi.fn() }));

vi.mock('@app/features/guides/registry', () => ({
  guideForTargetCountry: guideForTargetCountryMock,
  guideHref: () => '/de/guide/rechnung-pflichtangaben',
}));

afterEach(() => {
  cleanup();
  guideForTargetCountryMock.mockReset();
});

describe('CountryCardGuideLink', () => {
  it('renders nothing when the country has no guide yet', () => {
    guideForTargetCountryMock.mockReturnValue(undefined);
    const { container } = render(<CountryCardGuideLink country="DE" label="Guide" />);
    expect(container.firstChild).toBeNull();
  });

  it("links to that country's guide when one exists", () => {
    guideForTargetCountryMock.mockReturnValue({ slug: 'rechnung-pflichtangaben', locale: 'de' });
    render(<CountryCardGuideLink country="DE" label="Guide" />);
    const link = screen.getByRole('link', { name: 'Guide' });
    expect(link.getAttribute('href')).toBe('/de/guide/rechnung-pflichtangaben');
  });
});
