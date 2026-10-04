import { hasGuideIndex } from '@app/features/guides/indexAlternates';
import brandIcon from '@app/features/shell/brand-icon.png';
import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { productNameForLocale } from './company';
import { LegalFooter } from './LegalFooter';

interface LegalShellProps {
  locale?: Locale;
  children: ReactNode;
}

export function LegalShell({ locale = 'bg', children }: LegalShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-10 px-4 py-10">
      <Link href={toLocalePath('/', locale)} className="flex items-center gap-3 self-start">
        <Image src={brandIcon} alt="" className="h-9 w-9" priority />
        <span className="text-lg font-bold text-text">{productNameForLocale(locale)}</span>
      </Link>
      <main className="flex-1">{children}</main>
      <LegalFooter locale={locale} guideIndex={hasGuideIndex(locale)} />
    </div>
  );
}
