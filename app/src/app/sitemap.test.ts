import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('always lists the home, signup and legal pages for every published locale', () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain('https://www.fakturcho.com/');
    expect(urls).toContain('https://www.fakturcho.com/en/signup');
    expect(urls).toContain('https://www.fakturcho.com/en/privacy');
  });

  it('lists a guide entry for every registered guide, if any exist', () => {
    const entries = sitemap();
    const guideEntries = entries.filter((entry) => entry.url.includes('/guide/'));
    for (const entry of guideEntries) {
      expect(entry.changeFrequency).toBe('monthly');
      expect(typeof entry.lastModified).toBe('string');
    }
  });

  it('links the guide index pages to each other as language versions', () => {
    const indexes = sitemap().filter((entry) => /\/guide$/.test(entry.url));
    expect(indexes).toHaveLength(7);
    for (const entry of indexes) {
      expect(entry.lastModified).toBe('2026-09-25');
      expect(entry.alternates?.languages).toMatchObject({
        bg: 'https://www.fakturcho.com/guide',
        de: 'https://www.fakturcho.com/de/guide',
        en: 'https://www.fakturcho.com/en/guide',
        'x-default': 'https://www.fakturcho.com/guide',
      });
    }
  });

  it('never crashes when no guides are registered yet', () => {
    expect(() => sitemap()).not.toThrow();
  });
});
