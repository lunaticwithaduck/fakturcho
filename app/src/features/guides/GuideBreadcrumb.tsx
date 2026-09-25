import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import Link from 'next/link';

interface GuideBreadcrumbProps {
  locale: Locale;
  homeLabel: string;
  guidesLabel: string;
  title: string;
}

export function GuideBreadcrumb({ locale, homeLabel, guidesLabel, title }: GuideBreadcrumbProps) {
  return (
    <nav
      aria-label={guidesLabel}
      className="flex flex-wrap items-center gap-2 text-sm text-text-muted"
    >
      <Link href={toLocalePath('/', locale)} className="underline">
        {homeLabel}
      </Link>
      <span aria-hidden="true">/</span>
      <Link href={toLocalePath('/guide', locale)} className="underline">
        {guidesLabel}
      </Link>
      <span aria-hidden="true">/</span>
      <span className="text-text">{title}</span>
    </nav>
  );
}
