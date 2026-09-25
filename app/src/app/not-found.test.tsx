// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getTranslationsMock } = vi.hoisted(() => ({ getTranslationsMock: vi.fn() }));

vi.mock('next-intl/server', () => ({ getTranslations: getTranslationsMock }));

function translatorFor(messages: typeof bgMessages) {
  const scoped = messages.notFound;
  return (key: keyof typeof scoped) => scoped[key];
}

import NotFound, { generateMetadata } from './not-found';

afterEach(cleanup);

describe('NotFound', () => {
  it('renders the Bulgarian copy unchanged from before', async () => {
    getTranslationsMock.mockResolvedValue(translatorFor(bgMessages));

    render(await NotFound());

    expect(screen.getByRole('heading', { name: 'Страницата не е намерена' })).toBeTruthy();
    expect(
      screen.getByText('Страницата, която търсите, не съществува или е преместена.'),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Към Фактурчо' })).toBeTruthy();

    const metadata = await generateMetadata();
    expect(metadata.title).toBe('Страницата не е намерена');
  });

  it('renders the English copy for an English request', async () => {
    getTranslationsMock.mockResolvedValue(translatorFor(enMessages));

    render(await NotFound());

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(
      screen.getByText('The page you are looking for does not exist or has been moved.'),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to Fakturcho' })).toBeTruthy();

    const metadata = await generateMetadata();
    expect(metadata.title).toBe('Page not found');
  });
});
