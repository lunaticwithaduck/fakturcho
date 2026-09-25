import type { Locale } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { buildHelpRegistry } from './registry';
import type { HelpContent } from './types';

function stubHelp(locale: Locale): HelpContent {
  return {
    locale,
    title: `${locale} title`,
    intro: `${locale} intro`,
    sections: [],
    faqHeading: 'FAQ',
    faq: [],
  };
}

describe('help registry — locale lookup', () => {
  const registry = buildHelpRegistry([stubHelp('de'), stubHelp('en')]);

  it('returns the content for a locale that exists', () => {
    expect(registry.getHelpContent('de')?.title).toBe('de title');
  });

  it('falls back to en for a locale with no content yet', () => {
    expect(registry.getHelpContent('fr')?.title).toBe('en title');
    expect(registry.getHelpContent('bg')?.title).toBe('en title');
  });
});

describe('help registry — absent content', () => {
  it('returns undefined without throwing when no help pages exist', () => {
    const registry = buildHelpRegistry([]);
    expect(registry.getHelpContent('en')).toBeUndefined();
    expect(registry.getHelpContent('bg')).toBeUndefined();
  });
});
