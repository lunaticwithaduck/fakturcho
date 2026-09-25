import type { Locale } from '@shared/types';
import { PUBLISHED_LOCALES } from '@shared/types';
import { AUTONYMS, NAV_LABELS } from './languageNames';
import { LOCALE_QUERY_PARAM } from './localeRedirect';

interface LanguageSwitcherProps {
  locale: Locale;
  currentPath: string;
  enabled: boolean;
  className?: string;
}

export function LanguageSwitcher({
  locale,
  currentPath,
  enabled,
  className,
}: LanguageSwitcherProps) {
  if (!enabled) return null;

  return (
    <nav
      aria-label={NAV_LABELS[locale]}
      className={['flex flex-wrap items-center gap-x-3 gap-y-1 text-sm', className]
        .filter(Boolean)
        .join(' ')}
    >
      {PUBLISHED_LOCALES.map((code) => (
        <a
          key={code}
          href={`${currentPath}?${LOCALE_QUERY_PARAM}=${code}`}
          aria-current={locale === code ? 'true' : undefined}
          className={locale === code ? 'font-semibold text-text' : 'text-text-muted underline'}
        >
          {AUTONYMS[code]}
        </a>
      ))}
    </nav>
  );
}
