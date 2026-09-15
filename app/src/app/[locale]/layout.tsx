import { getFeatureFlags } from '@app/feature-flags';
import { NON_DEFAULT_PUBLISHED_LOCALES } from '@app/i18n/locale';
import { ogLocaleAlternates, ogLocaleTag } from '@app/i18n/ogLocale';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export function generateStaticParams() {
  return NON_DEFAULT_PUBLISHED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    openGraph: {
      type: 'website',
      locale: ogLocaleTag(locale as Locale),
      alternateLocale: ogLocaleAlternates(locale as Locale),
      siteName: 'Fakturcho',
    },
  };
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const [flags, { locale }] = await Promise.all([getFeatureFlags(), params]);
  const isPublished = (NON_DEFAULT_PUBLISHED_LOCALES as readonly string[]).includes(locale);
  if (!flags.EN_LOCALE || !isPublished) notFound();

  return children;
}
