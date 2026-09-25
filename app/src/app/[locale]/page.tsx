import { LandingPage } from '@app/features/marketing/LandingPage';
import { buildSiteJsonLd } from '@app/features/marketing/siteJsonLd';
import { loadMessages } from '@app/i18n/locale';
import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import { ogLocaleAlternates, ogLocaleTag } from '@app/i18n/ogLocale';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const seo = (await loadMessages(locale as Locale)).seo.home;
  const canonical = toLocalePath('/', locale as Locale);
  return {
    title: { absolute: seo.title },
    description: seo.description,
    openGraph: {
      type: 'website',
      locale: ogLocaleTag(locale as Locale),
      alternateLocale: ogLocaleAlternates(locale as Locale),
      siteName: 'Fakturcho',
      title: seo.title,
      description: seo.description,
    },
    alternates: {
      canonical,
      languages: hreflangAlternates('/'),
    },
  };
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const store = await cookies();
  if (store.getAll().some((entry) => entry.name.endsWith('session_token'))) {
    redirect('/documents');
  }
  return (
    <>
      <script type="application/ld+json">{buildSiteJsonLd()}</script>
      <LandingPage locale={locale as Locale} enEnabled />
    </>
  );
}
