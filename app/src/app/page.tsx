import { COMPANY } from '@app/features/legal/company';
import { LandingPage } from '@app/features/marketing/LandingPage';
import { LANDING_FAQ } from '@app/features/marketing/landingFaq';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: { absolute: 'Фактурчо — фактури за българския бизнес' },
  description:
    'Издавайте фактури, проформи, кредитни и дебитни известия и оферти по българските изисквания. Плащате 0,10 € на издаден документ.',
};

function buildJsonLd() {
  const organization = {
    '@type': 'Organization',
    '@id': `${COMPANY.website}/#organization`,
    name: COMPANY.productName,
    url: COMPANY.website,
    logo: `${COMPANY.website}/icon.png`,
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${COMPANY.website}/#website`,
    name: COMPANY.productName,
    url: COMPANY.website,
    inLanguage: 'bg',
    publisher: { '@id': `${COMPANY.website}/#organization` },
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
    '@graph': [organization, website, faqPage],
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
