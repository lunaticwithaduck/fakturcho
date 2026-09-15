import { COMPANY } from '@app/features/legal/company';
import { LandingPage } from '@app/features/marketing/LandingPage';
import { getLandingFaq } from '@app/features/marketing/landingFaq';
import { SUBSCRIPTION_TIER_IDS, SUBSCRIPTION_TIERS } from '@shared/types';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const TITLE = 'Fakturcho — invoicing and e-invoicing for EU businesses';
const DESCRIPTION =
  'Issue invoices, proformas, credit and debit notes and quotes that meet EU requirements, with EN 16931 e-invoicing and Peppol. Pay 0.10 € per issued document.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['bg_BG'],
    siteName: 'Fakturcho',
    title: TITLE,
    description: DESCRIPTION,
  },
  alternates: {
    canonical: '/en',
    languages: {
      bg: '/',
      en: '/en',
      'x-default': '/',
    },
  },
};

function buildJsonLd() {
  const softwareApplication = {
    '@type': 'SoftwareApplication',
    name: 'Fakturcho',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'en',
    url: `${COMPANY.website}/en`,
    description: DESCRIPTION,
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
    name: 'Fakturcho',
    url: `${COMPANY.website}/en`,
    logo: `${COMPANY.website}/en/opengraph-image`,
  };
  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: getLandingFaq('en').map((item) => ({
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

export default async function EnglishHomePage() {
  const store = await cookies();
  if (store.getAll().some((entry) => entry.name.endsWith('session_token'))) {
    redirect('/documents');
  }
  return (
    <>
      <script type="application/ld+json">{buildJsonLd()}</script>
      <LandingPage locale="en" />
    </>
  );
}
