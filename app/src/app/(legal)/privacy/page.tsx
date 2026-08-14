import { LegalDocument } from '@app/features/legal/LegalDocument';
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from '@app/features/legal/privacySections';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика за поверителност — Фактурчо',
  description: 'Как Фактурчо обработва лични данни.',
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
