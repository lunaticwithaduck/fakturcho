import type { Locale } from '@shared/types';
import { HELP_MODULES } from './content';
import type { HelpContent } from './types';

export function buildHelpRegistry(items: readonly HelpContent[]) {
  const byLocale = new Map(items.map((item) => [item.locale, item]));

  return {
    getHelpContent(locale: Locale): HelpContent | undefined {
      return byLocale.get(locale) ?? byLocale.get('en');
    },
  };
}

const registry = buildHelpRegistry(HELP_MODULES);

export const getHelpContent = registry.getHelpContent;
