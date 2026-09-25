// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { describe, expect, it, vi } from 'vitest';

const { getTranslationsMock } = vi.hoisted(() => ({ getTranslationsMock: vi.fn() }));

vi.mock('next-intl/server', () => ({ getTranslations: getTranslationsMock }));

function translatorFor(messages: typeof bgMessages) {
  const scoped = messages.documents.list;
  return (key: keyof typeof scoped) => scoped[key];
}

import { generateMetadata } from './page';

describe('DocumentsPage metadata', () => {
  it('titles the browser tab in Bulgarian, unchanged from before', async () => {
    getTranslationsMock.mockResolvedValue(translatorFor(bgMessages));

    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Документи');
  });

  it('titles the browser tab in English for an English visitor', async () => {
    getTranslationsMock.mockResolvedValue(translatorFor(enMessages));

    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Documents');
  });
});
