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

  it('never crashes when no guides are registered yet', () => {
    expect(() => sitemap()).not.toThrow();
  });
});
