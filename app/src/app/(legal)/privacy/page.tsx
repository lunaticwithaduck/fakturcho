import { LegalDocument } from '@app/features/legal/LegalDocument';
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from '@app/features/legal/privacySections';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика за поверителност',
  description: 'Как Фактурчо обработва лични данни.',
  alternates: {
    canonical: '/privacy',
    languages: {
      bg: '/privacy',
      en: '/en/privacy',
    },
  },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Политика за поверителност"
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
    />
  );
}
