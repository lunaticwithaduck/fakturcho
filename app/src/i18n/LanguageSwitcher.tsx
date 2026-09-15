import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { Locale } from '@shared/types';
import Link from 'next/link';
import { LOCALE_QUERY_PARAM } from './localeRedirect';

const CONTENT = { bg: bgMessages.languageSwitcher, en: enMessages.languageSwitcher };

const BG_LABEL = 'БГ';
const EN_LABEL = 'EN';

interface LanguageSwitcherProps {
  locale: Locale;
  currentPath: string;
  enabled: boolean;
}

export function LanguageSwitcher({ locale, currentPath, enabled }: LanguageSwitcherProps) {
  if (!enabled) return null;
  const t = CONTENT[locale];

  return (
    <nav aria-label={t.navLabel} className="flex items-center gap-2 text-sm">
      <Link
        href={`${currentPath}?${LOCALE_QUERY_PARAM}=bg`}
        aria-label={t.bgFull}
        aria-current={locale === 'bg' ? 'true' : undefined}
        className={locale === 'bg' ? 'font-semibold text-text' : 'text-text-muted underline'}
      >
        {BG_LABEL}
      </Link>
      <span aria-hidden="true" className="text-text-subtle">
        /
      </span>
      <Link
        href={`${currentPath}?${LOCALE_QUERY_PARAM}=en`}
        aria-label={t.enFull}
        aria-current={locale === 'en' ? 'true' : undefined}
        className={locale === 'en' ? 'font-semibold text-text' : 'text-text-muted underline'}
      >
        {EN_LABEL}
      </Link>
    </nav>
  );
}
