import { describe, expect, it, vi } from 'vitest';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import BgGuideIndexPage, { metadata } from './page';

describe('bg guide index metadata', () => {
  it('is absolutely titled and self-canonical', () => {
    expect(metadata.title).toEqual({ absolute: 'Наръчници — Фактурчо' });
    expect(metadata.alternates?.canonical).toBe('/guide');
    expect(typeof metadata.description).toBe('string');
  });
});

describe('BgGuideIndexPage', () => {
  it('renders the bg guide index without calling notFound', () => {
    expect(BgGuideIndexPage()).toBeTruthy();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
