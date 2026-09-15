import { COMPANY, productNameForLocale } from '@app/features/legal/company';
import { LandingPage } from '@app/features/marketing/LandingPage';
import { getLandingFaq } from '@app/features/marketing/landingFaq';
import { loadMessages } from '@app/i18n/locale';
import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import { ogLocaleTag } from '@app/i18n/ogLocale';
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

function buildJsonLd(locale: Locale) {
  const path = toLocalePath('/', locale);
  const url = `${COMPANY.website}${path}`;
  const organization = {
    '@type': 'Organization',
    '@id': `${COMPANY.website}/#organization`,
    name: productNameForLocale(locale),
    url: COMPANY.website,
    logo: `${COMPANY.website}/icon.png`,
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${COMPANY.website}/#website`,
    name: productNameForLocale(locale),
    url,
    inLanguage: locale,
    publisher: { '@id': `${COMPANY.website}/#organization` },
  };
  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: getLandingFaq(locale).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [organization, website, faqPage],
  }).replace(/</g, '\\u003c');
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const store = await cookies();
  if (store.getAll().some((entry) => entry.name.endsWith('session_token'))) {
    redirect('/documents');
  }
  return (
    <>
      <script type="application/ld+json">{buildJsonLd(locale as Locale)}</script>
      <LandingPage locale={locale as Locale} enEnabled />
    </>
  );
}
