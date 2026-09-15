import { getFeatureFlags } from '@app/feature-flags';
import { LegalDocument } from '@app/features/legal/LegalDocument';
import { TERMS_INTRO, TERMS_SECTIONS } from '@app/features/legal/termsSections';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Общи условия',
  description: 'Общите условия за ползване на Фактурчо.',
  alternates: {
    canonical: '/terms',
    languages: {
      bg: '/terms',
      en: '/en/terms',
      'x-default': '/terms',
    },
  },
};

export default async function TermsPage() {
  const flags = await getFeatureFlags();
  return (
    <LegalDocument
      title="Общи условия"
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
      currentPath="/terms"
      enEnabled={flags.EN_LOCALE}
    />
  );
}
