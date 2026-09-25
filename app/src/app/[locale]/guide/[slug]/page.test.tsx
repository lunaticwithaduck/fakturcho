import { describe, expect, it, vi } from 'vitest';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import LocaleGuideSlugPage, { generateMetadata } from './page';

describe('LocaleGuideSlugPage', () => {
  it('calls notFound for a locale/slug pair with no matching guide', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ locale: 'de', slug: 'does-not-exist' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    await expect(
      LocaleGuideSlugPage({ params: Promise.resolve({ locale: 'de', slug: 'does-not-exist' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
