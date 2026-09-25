import { GuidePage } from '@app/features/guides/GuidePage';
import { getGuide, guidesForLocale } from '@app/features/guides/registry';
import { ogLocaleTag } from '@app/i18n/ogLocale';
import bgMessages from '@messages/bg.json';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface BgGuideSlugPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return guidesForLocale('bg').map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: BgGuideSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide('bg', slug);
  if (!guide) notFound();

  return {
    title: { absolute: guide.title },
    description: guide.description,
    alternates: { canonical: `/guide/${guide.slug}` },
    openGraph: {
      type: 'article',
      locale: ogLocaleTag('bg'),
      siteName: bgMessages.marketing.brand,
      title: guide.title,
      description: guide.description,
      publishedTime: guide.lastReviewed,
      modifiedTime: guide.lastReviewed,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BgGuideSlugPage({ params }: BgGuideSlugPageProps) {
  const { slug } = await params;
  const guide = getGuide('bg', slug);
  if (!guide) notFound();

  return (
    <GuidePage
      guide={guide}
      chrome={{
        homeLabel: bgMessages.guides.breadcrumbHome,
        guidesLabel: bgMessages.guides.breadcrumbGuides,
        tocLabel: bgMessages.guides.tableOfContents,
        lastReviewedLabel: bgMessages.guides.lastReviewed,
        signupLabel: bgMessages.marketing.nav.signup,
        brand: bgMessages.marketing.brand,
        backToAppLabel: bgMessages.guides.backToApp,
      }}
    />
  );
}
