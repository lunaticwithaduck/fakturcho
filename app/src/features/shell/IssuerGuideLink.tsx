'use client';

import { useGetIssuerProfileQuery } from '@app/api';
import { useAuthSession } from '@app/auth/hooks';
import { guideForIssuerCountry, guideHref } from '@app/features/guides/registry';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function signupCountry(user: unknown): string | undefined {
  const country = (user as { country?: unknown } | undefined)?.country;
  return typeof country === 'string' && country.length > 0 ? country : undefined;
}

export function IssuerGuideLink({ className }: { className?: string }) {
  const t = useTranslations('shell');
  const { data } = useGetIssuerProfileQuery();
  const { session } = useAuthSession();
  if (!data) return null;
  const country = data.companyName ? data.country : (signupCountry(session?.user) ?? data.country);
  const guide = guideForIssuerCountry(country);
  if (!guide) return null;
  return (
    <Link href={guideHref(guide)} className={className}>
      {t('guideLink')}
    </Link>
  );
}
