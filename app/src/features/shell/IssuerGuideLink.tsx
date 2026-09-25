'use client';

import { useGetIssuerProfileQuery } from '@app/api';
import { guideForIssuerCountry, guideHref } from '@app/features/guides/registry';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function IssuerGuideLink({ className }: { className?: string }) {
  const t = useTranslations('shell');
  const { data } = useGetIssuerProfileQuery();
  const guide = guideForIssuerCountry(data?.country);
  if (!guide) return null;
  return (
    <Link href={guideHref(guide)} className={className}>
      {t('guideLink')}
    </Link>
  );
}
