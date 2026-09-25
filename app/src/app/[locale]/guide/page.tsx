import { GuideIndexPage } from '@app/features/guides/GuideIndexPage';
import { guideIndexAlternates } from '@app/features/guides/indexAlternates';
import { euGuide, guidesForLocale } from '@app/features/guides/registry';
import { loadMessages } from '@app/i18n/locale';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface LocaleGuideIndexPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleGuideIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const messages = await loadMessages(locale as Locale);
  return {
    title: { absolute: `${messages.guides.breadcrumbGuides} — ${messages.marketing.brand}` },
    description: messages.guides.indexDescription,
    alternates: { canonical: `/${locale}/guide`, languages: guideIndexAlternates() },
  };
}

export default async function LocaleGuideIndexPage({ params }: LocaleGuideIndexPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const guides = guidesForLocale(typedLocale);
  const eu = euGuide();
  if (guides.length === 0 && !eu) notFound();
  const messages = await loadMessages(typedLocale);

  return (
    <GuideIndexPage
      locale={typedLocale}
      heading={messages.guides.breadcrumbGuides}
      guides={guides}
      euOverview={eu}
      euOverviewLabel={messages.guides.euOverviewLink}
      backToAppLabel={messages.guides.backToApp}
    />
  );
}
