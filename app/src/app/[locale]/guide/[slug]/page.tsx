import { GuidePage } from '@app/features/guides/GuidePage';
import { getGuide } from '@app/features/guides/registry';
import { loadMessages } from '@app/i18n/locale';
import { ogLocaleTag } from '@app/i18n/ogLocale';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface LocaleGuideSlugPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: LocaleGuideSlugPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuide(locale as Locale, slug);
  if (!guide) notFound();
  const messages = await loadMessages(locale as Locale);

  return {
    title: { absolute: guide.title },
    description: guide.description,
    alternates: { canonical: `/${locale}/guide/${guide.slug}` },
    openGraph: {
      type: 'article',
      locale: ogLocaleTag(locale as Locale),
      siteName: messages.marketing.brand,
      title: guide.title,
      description: guide.description,
      publishedTime: guide.lastReviewed,
      modifiedTime: guide.lastReviewed,
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleGuideSlugPage({ params }: LocaleGuideSlugPageProps) {
  const { locale, slug } = await params;
  const guide = getGuide(locale as Locale, slug);
  if (!guide) notFound();
  const messages = await loadMessages(locale as Locale);

  return (
    <GuidePage
      guide={guide}
      chrome={{
        homeLabel: messages.guides.breadcrumbHome,
        guidesLabel: messages.guides.breadcrumbGuides,
        tocLabel: messages.guides.tableOfContents,
        lastReviewedLabel: messages.guides.lastReviewed,
        signupLabel: messages.marketing.nav.signup,
        brand: messages.marketing.brand,
      }}
    />
  );
}
