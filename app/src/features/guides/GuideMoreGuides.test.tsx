// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GuideMoreGuides } from './GuideMoreGuides';
import { euGuide, guidesForLocale } from './registry';

afterEach(cleanup);

describe('GuideMoreGuides', () => {
  it('renders nothing when there is nothing to list', () => {
    const { container } = render(
      <GuideMoreGuides
        locale="en"
        heading="Guides"
        guides={[]}
        euOverview={euGuide()}
        euOverviewLabel="EU"
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('lists each guide by its h1 under an h2 and adds the EU overview on non-English locales', () => {
    const guides = guidesForLocale('fr');
    render(
      <GuideMoreGuides
        locale="fr"
        heading="Guides"
        guides={guides}
        euOverview={euGuide()}
        euOverviewLabel="Aperçu UE"
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Guides' })).toBeTruthy();
    for (const guide of guides) {
      expect(screen.getByRole('link', { name: guide.h1 }).getAttribute('href')).toBe(
        `/fr/guide/${guide.slug}`,
      );
    }
    expect(screen.getByRole('link', { name: 'Aperçu UE' }).getAttribute('href')).toBe(
      `/en/guide/${euGuide()?.slug}`,
    );
  });
});
