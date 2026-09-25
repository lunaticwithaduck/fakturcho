'use client';

import { LegalFooter } from '@app/features/legal/LegalFooter';
import brandIcon from '@app/features/shell/brand-icon.png';
import { LanguageSwitcher } from '@app/i18n/LanguageSwitcher';
import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface AuthShellProps {
  locale?: Locale;
  enEnabled?: boolean;
  children: ReactNode;
}

export function AuthShell({ locale = 'bg', enEnabled = false, children }: AuthShellProps) {
  const t = useTranslations('auth');
  const pathname = usePathname();
  const homeHref = toLocalePath('/', locale);

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <main className="flex flex-col items-center gap-6">
        <Link href={homeHref} className="flex items-center gap-3">
          <Image src={brandIcon} alt="" className="h-12 w-12" priority />
          <span className="text-xl font-bold text-text">{t('brandName')}</span>
        </Link>
        <LanguageSwitcher
          locale={locale}
          currentPath={pathname}
          enabled={enEnabled}
          className="justify-center"
        />
        <div className="w-full">{children}</div>
      </main>
      <LegalFooter locale={locale} />
    </div>
  );
}
