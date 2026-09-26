import type { Locale } from '@shared/types';

// Autonyms and the nav's accessible name are UI chrome, not translated
// content — they live here so a translator never has to touch them.
export const AUTONYMS: Record<Locale, string> = {
  bg: 'Български',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pl: 'Polski',
  ro: 'Română',
};

export const NAV_LABELS: Record<Locale, string> = {
  bg: 'Избор на език',
  en: 'Language',
  de: 'Sprache',
  fr: 'Langue',
  it: 'Lingua',
  pl: 'Język',
  ro: 'Limbă',
};
