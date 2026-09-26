import { describe, expect, it, vi } from 'vitest';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import BgGuideSlugPage, { generateMetadata, generateStaticParams } from './page';

describe('generateStaticParams', () => {
  it('returns one entry per registered bg guide', () => {
    expect(generateStaticParams()).toEqual([
      { slug: 'faktura-zadalzhitelni-rekviziti-zdds' },
      { slug: 'faktura-avstriya-zadalzhitelni-rekviziti' },
    ]);
  });
});

describe('BgGuideSlugPage', () => {
  it('calls notFound for a slug with no matching guide', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: 'does-not-exist' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    await expect(
      BgGuideSlugPage({ params: Promise.resolve({ slug: 'does-not-exist' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
