import { COMPANY } from '@app/features/legal/company';
import { LandingPage } from '@app/features/marketing/LandingPage';
import { LANDING_FAQ } from '@app/features/marketing/landingFaq';
import { SUBSCRIPTION_TIER_IDS, SUBSCRIPTION_TIERS } from '@shared/types';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: { absolute: 'Фактурчо — фактури за българския бизнес' },
  description:
    'Издавайте фактури, проформи, кредитни и дебитни известия и оферти по българските изисквания. Плащате 0,10 € на издаден документ.',
};

function buildJsonLd() {
  const softwareApplication = {
    '@type': 'SoftwareApplication',
    name: COMPANY.productName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'bg',
    url: COMPANY.website,
    description: metadata.description,
    offers: [
      {
        '@type': 'Offer',
        price: '0.10',
        priceCurrency: 'EUR',
        description: 'на издаден документ',
      },
      ...SUBSCRIPTION_TIER_IDS.map((id) => ({
        '@type': 'Offer',
        price: (SUBSCRIPTION_TIERS[id].priceCents / 100).toFixed(2),
        priceCurrency: 'EUR',
        description: `абонамент на месец, зарежда ${(SUBSCRIPTION_TIERS[id].grantCents / 100).toFixed(2)} € кредит`,
      })),
    ],
  };
  const organization = {
    '@type': 'Organization',
    name: COMPANY.productName,
    url: COMPANY.website,
    logo: `${COMPANY.website}/opengraph-image`,
  };
  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQ.map((item) => ({
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

export default async function HomePage() {
  const store = await cookies();
  if (store.getAll().some((entry) => entry.name.endsWith('session_token'))) {
    redirect('/documents');
  }
  return (
    <>
      <script type="application/ld+json">{buildJsonLd()}</script>
      <LandingPage />
    </>
  );
}
