import { allGuides, guideHref } from './registry';
import type { GuideContent } from './types';

export function guideAlternates(guide: GuideContent): Record<string, string> | undefined {
  const siblings = allGuides().filter((candidate) => candidate.country === guide.country);
  if (siblings.length < 2) return undefined;
  return {
    ...Object.fromEntries(siblings.map((sibling) => [sibling.locale, guideHref(sibling)])),
    'x-default': guideHref(siblings[0] ?? guide),
  };
}
