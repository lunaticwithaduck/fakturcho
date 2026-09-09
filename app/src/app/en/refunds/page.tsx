import { LegalDocument } from '@app/features/legal/LegalDocument';
import { getLegalDoc } from '@app/features/legal/legalContent';
import type { Metadata } from 'next';

const doc = getLegalDoc('refunds', 'en');

export const metadata: Metadata = {
  title: doc.metaTitle,
  description: doc.metaDescription,
  alternates: {
    canonical: '/en/refunds',
    languages: {
      bg: '/refunds',
      en: '/en/refunds',
    },
  },
};

export default function EnglishRefundsPage() {
  return (
    <LegalDocument
      title={doc.title}
      intro={doc.intro}
      sections={doc.sections}
      lastUpdatedLabel={doc.lastUpdatedLabel}
    />
  );
}
