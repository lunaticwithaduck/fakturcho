import { LegalDocument } from '@app/features/legal/LegalDocument';
import { getLegalDoc } from '@app/features/legal/legalContent';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';
import { legalAlternates, providedInEnglishNote } from '../legalPages';

const doc = getLegalDoc('privacy', 'en');

interface LocalePrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocalePrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: { absolute: doc.metaTitle },
    description: doc.metaDescription,
    alternates: legalAlternates('privacy', locale),
  };
}

export default async function LocalePrivacyPage({ params }: LocalePrivacyPageProps) {
  const { locale } = await params;
  const note = await providedInEnglishNote(locale as Locale);
  return (
    <LegalDocument
      title={doc.title}
      intro={doc.intro}
      sections={doc.sections}
      lastUpdatedLabel={doc.lastUpdatedLabel}
      locale={locale as Locale}
      currentPath={`/${locale}/privacy`}
      enEnabled
      note={note}
    />
  );
}
