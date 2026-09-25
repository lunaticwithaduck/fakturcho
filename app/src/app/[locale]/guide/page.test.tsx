import { describe, expect, it, vi } from 'vitest';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import LocaleGuideIndexPage, { generateMetadata } from './page';

describe('locale guide index metadata', () => {
  it('is absolutely titled and self-canonical per locale', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'de' }) });
    expect(metadata.title).toEqual({ absolute: 'Leitfäden — Fakturcho' });
    expect(metadata.alternates?.canonical).toBe('/de/guide');
  });
});

describe('LocaleGuideIndexPage', () => {
  it('renders the de guide index without calling notFound', async () => {
    await expect(
      LocaleGuideIndexPage({ params: Promise.resolve({ locale: 'de' }) }),
    ).resolves.toBeTruthy();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
