import type { Locale } from '@shared/types';
import { PUBLISHED_LOCALES } from '@shared/types';
import Link from 'next/link';
import { LOCALE_QUERY_PARAM } from './localeRedirect';

// Autonyms and the nav's accessible name are UI chrome, not translated
// content — they live here so a translator never has to touch this file.
const AUTONYMS: Record<Locale, string> = {
  bg: 'Български',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pl: 'Polski',
  ro: 'Română',
  es: 'Español',
};

const NAV_LABELS: Record<Locale, string> = {
  bg: 'Избор на език',
  en: 'Language',
  de: 'Sprache',
  fr: 'Langue',
  it: 'Lingua',
  pl: 'Język',
  ro: 'Limbă',
  es: 'Idioma',
};

interface LanguageSwitcherProps {
  locale: Locale;
  currentPath: string;
  enabled: boolean;
}

export function LanguageSwitcher({ locale, currentPath, enabled }: LanguageSwitcherProps) {
  if (!enabled) return null;

  return (
    <nav
      aria-label={NAV_LABELS[locale]}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
    >
      {PUBLISHED_LOCALES.map((code) => (
        <Link
          key={code}
          href={`${currentPath}?${LOCALE_QUERY_PARAM}=${code}`}
          aria-current={locale === code ? 'true' : undefined}
          className={locale === code ? 'font-semibold text-text' : 'text-text-muted underline'}
        >
          {AUTONYMS[code]}
        </Link>
      ))}
    </nav>
  );
}
