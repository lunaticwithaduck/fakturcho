import { GuideIndexPage } from '@app/features/guides/GuideIndexPage';
import { guideIndexAlternates } from '@app/features/guides/indexAlternates';
import { euGuide, guidesForLocale } from '@app/features/guides/registry';
import bgMessages from '@messages/bg.json';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: { absolute: `${bgMessages.guides.breadcrumbGuides} — ${bgMessages.marketing.brand}` },
  description: bgMessages.guides.indexDescription,
  alternates: { canonical: '/guide', languages: guideIndexAlternates() },
};

export default function BgGuideIndexPage() {
  const guides = guidesForLocale('bg');
  const eu = euGuide();
  if (guides.length === 0 && !eu) notFound();

  return (
    <GuideIndexPage
      locale="bg"
      heading={bgMessages.guides.breadcrumbGuides}
      guides={guides}
      euOverview={eu}
      euOverviewLabel={bgMessages.guides.euOverviewLink}
      backToAppLabel={bgMessages.guides.backToApp}
    />
  );
}
