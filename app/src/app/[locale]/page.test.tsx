// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { generateMetadata } from './page';

describe('LocaleHomePage metadata', () => {
  it('carries og:locale and every other published locale as og:locale:alternate', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });

    expect(metadata.openGraph?.locale).toBe('en_US');
    expect(metadata.openGraph).toMatchObject({
      alternateLocale: ['bg_BG', 'de_DE', 'fr_FR', 'it_IT', 'pl_PL', 'ro_RO', 'es_ES'],
    });
  });

  it('derives the alternate list from the current locale for a different locale', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'de' }) });

    expect(metadata.openGraph?.locale).toBe('de_DE');
    expect(metadata.openGraph).toMatchObject({
      alternateLocale: ['bg_BG', 'en_US', 'fr_FR', 'it_IT', 'pl_PL', 'ro_RO', 'es_ES'],
    });
  });
});
