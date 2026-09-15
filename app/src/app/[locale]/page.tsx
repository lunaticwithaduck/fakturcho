import { COMPANY } from '@app/features/legal/company';
import { LandingPage } from '@app/features/marketing/LandingPage';
import { getLandingFaq } from '@app/features/marketing/landingFaq';
import { loadMessages } from '@app/i18n/locale';
import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import { ogLocaleTag } from '@app/i18n/ogLocale';
import type { Locale } from '@shared/types';
import { SUBSCRIPTION_TIER_IDS, SUBSCRIPTION_TIERS } from '@shared/types';
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

function buildJsonLd(locale: Locale, title: string, description: string) {
  const path = toLocalePath('/', locale);
  const softwareApplication = {
    '@type': 'SoftwareApplication',
    name: 'Fakturcho',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: locale,
    url: `${COMPANY.website}${path}`,
    description,
    offers: [
      {
        '@type': 'Offer',
        price: '0.10',
        priceCurrency: 'EUR',
        description: 'per issued document',
      },
      ...SUBSCRIPTION_TIER_IDS.map((id) => ({
        '@type': 'Offer',
        price: (SUBSCRIPTION_TIERS[id].priceCents / 100).toFixed(2),
        priceCurrency: 'EUR',
        description: `monthly subscription, grants ${(SUBSCRIPTION_TIERS[id].grantCents / 100).toFixed(2)} € credit`,
      })),
    ],
  };
  const organization = {
    '@type': 'Organization',
    name: title,
    url: `${COMPANY.website}${path}`,
    logo: `${COMPANY.website}${path}/opengraph-image`,
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
    '@graph': [softwareApplication, organization, faqPage],
  }).replace(/</g, '\\u003c');
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const [store, messages] = await Promise.all([cookies(), loadMessages(locale as Locale)]);
  if (store.getAll().some((entry) => entry.name.endsWith('session_token'))) {
    redirect('/documents');
  }
  return (
    <>
      <script type="application/ld+json">
        {buildJsonLd(locale as Locale, messages.seo.home.title, messages.seo.home.description)}
      </script>
      <LandingPage locale={locale as Locale} enEnabled />
    </>
  );
}
