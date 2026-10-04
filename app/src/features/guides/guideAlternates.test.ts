import { describe, expect, it } from 'vitest';
import { guideAlternates } from './guideAlternates';
import { allGuides, guideHref } from './registry';

describe('guideAlternates', () => {
  it('gives every language version of a shared-country guide the same set, itself included', () => {
    const sets = new Map<string, Record<string, string>[]>();
    for (const guide of allGuides()) {
      const languages = guideAlternates(guide);
      if (!languages) continue;
      expect(languages[guide.locale]).toBe(guideHref(guide));
      expect(languages['x-default']).toBeDefined();
      sets.set(guide.country, [...(sets.get(guide.country) ?? []), languages]);
    }
    expect(sets.size).toBeGreaterThan(0);
    for (const group of sets.values()) {
      for (const languages of group) expect(languages).toEqual(group[0]);
    }
  });

  it('is absent for a country with a single guide', () => {
    const single = allGuides().find(
      (guide) => allGuides().filter((other) => other.country === guide.country).length === 1,
    );
    if (single) expect(guideAlternates(single)).toBeUndefined();
  });
});
