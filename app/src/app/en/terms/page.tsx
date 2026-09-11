import { LegalDocument } from '@app/features/legal/LegalDocument';
import { getLegalDoc } from '@app/features/legal/legalContent';
import type { Metadata } from 'next';

const doc = getLegalDoc('terms', 'en');

export const metadata: Metadata = {
  title: doc.metaTitle,
  description: doc.metaDescription,
  alternates: {
    canonical: '/en/terms',
    languages: {
      bg: '/terms',
      en: '/en/terms',
      'x-default': '/terms',
    },
  },
};

export default function EnglishTermsPage() {
  return (
    <LegalDocument
      title={doc.title}
      intro={doc.intro}
      sections={doc.sections}
      lastUpdatedLabel={doc.lastUpdatedLabel}
    />
  );
}
