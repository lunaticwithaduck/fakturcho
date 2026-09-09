import { LegalDocument } from '@app/features/legal/LegalDocument';
import { getLegalDoc } from '@app/features/legal/legalContent';
import type { Metadata } from 'next';

const doc = getLegalDoc('privacy', 'en');

export const metadata: Metadata = {
  title: doc.metaTitle,
  description: doc.metaDescription,
  alternates: {
    canonical: '/en/privacy',
    languages: {
      bg: '/privacy',
      en: '/en/privacy',
    },
  },
};

export default function EnglishPrivacyPage() {
  return (
    <LegalDocument
      title={doc.title}
      intro={doc.intro}
      sections={doc.sections}
      lastUpdatedLabel={doc.lastUpdatedLabel}
    />
  );
}
