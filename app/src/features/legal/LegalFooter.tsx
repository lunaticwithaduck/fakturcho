import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import Link from 'next/link';
import { COMPANY, describeEntityForLocale } from './company';
import { getGuidesFooterLabel, getLegalFooterLinks } from './legalContent';

interface LegalFooterProps {
  locale?: Locale;
  entity?: boolean;
  guideIndex?: boolean;
}

export function LegalFooter({
  locale = 'bg',
  entity = true,
  guideIndex = false,
}: LegalFooterProps) {
  const links = getLegalFooterLinks(locale);

  return (
    <footer className="flex flex-col items-center gap-3 border-t border-border pt-6 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link href={toLocalePath('/terms', locale)} className="text-sm text-text-muted underline">
          {links.terms}
        </Link>
        <Link href={toLocalePath('/privacy', locale)} className="text-sm text-text-muted underline">
          {links.privacy}
        </Link>
        <Link href={toLocalePath('/refunds', locale)} className="text-sm text-text-muted underline">
          {links.refunds}
        </Link>
        {guideIndex ? (
          <Link href={toLocalePath('/guide', locale)} className="text-sm text-text-muted underline">
            {getGuidesFooterLabel(locale)}
          </Link>
        ) : null}
        <a href={`mailto:${COMPANY.supportEmail}`} className="text-sm text-text-muted underline">
          {links.contact}
        </a>
      </nav>
      {entity ? (
        <p className="text-xs text-text-subtle">{describeEntityForLocale(locale)}</p>
      ) : null}
    </footer>
  );
}
