import { LegalDocument } from '@app/features/legal/LegalDocument';
import { getLegalDoc } from '@app/features/legal/legalContent';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';
import { legalCanonical, legalHreflang, providedInEnglishNote } from '../legalPages';

const doc = getLegalDoc('terms', 'en');

export const metadata: Metadata = {
  title: { absolute: doc.metaTitle },
  description: doc.metaDescription,
  alternates: {
    canonical: legalCanonical('terms'),
    languages: legalHreflang('terms'),
  },
};

interface LocaleTermsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleTermsPage({ params }: LocaleTermsPageProps) {
  const { locale } = await params;
  const note = await providedInEnglishNote(locale as Locale);
  return (
    <LegalDocument
      title={doc.title}
      intro={doc.intro}
      sections={doc.sections}
      lastUpdatedLabel={doc.lastUpdatedLabel}
      locale={locale as Locale}
      currentPath={`/${locale}/terms`}
      enEnabled
      note={note}
    />
  );
}
