import type { Locale } from '@shared/types';
import Link from 'next/link';
import { COMPANY, describeEntityForLocale } from './company';
import { getLegalFooterLinks } from './legalContent';

interface LegalFooterProps {
  locale?: Locale;
}

export function LegalFooter({ locale = 'bg' }: LegalFooterProps) {
  const links = getLegalFooterLinks(locale);
  const prefix = locale === 'bg' ? '' : '/en';

  return (
    <footer className="flex flex-col items-center gap-3 border-t border-border pt-6 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link href={`${prefix}/terms`} className="text-sm text-text-muted underline">
          {links.terms}
        </Link>
        <Link href={`${prefix}/privacy`} className="text-sm text-text-muted underline">
          {links.privacy}
        </Link>
        <Link href={`${prefix}/refunds`} className="text-sm text-text-muted underline">
          {links.refunds}
        </Link>
        <a href={`mailto:${COMPANY.supportEmail}`} className="text-sm text-text-muted underline">
          {links.contact}
        </a>
      </nav>
      <p className="text-xs text-text-subtle">{describeEntityForLocale(locale)}</p>
    </footer>
  );
}
