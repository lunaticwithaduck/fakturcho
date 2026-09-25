'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import brandIcon from './brand-icon.png';
import { IssuerGuideLink } from './IssuerGuideLink';
import { SignOutButton } from './SignOutButton';

export function MobileHeader() {
  const t = useTranslations('shell');

  return (
    <header className="flex flex-col gap-2 border-b border-border bg-surface-raised px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src={brandIcon} alt="" className="h-6 w-6" />
          <p className="text-base font-bold text-text">{t('brandName')}</p>
        </div>
        <SignOutButton />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <IssuerGuideLink className="text-sm text-text-muted underline" />
        <Link href="/help" className="text-sm text-text-muted underline">
          {t('helpLink')}
        </Link>
      </div>
    </header>
  );
}
