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

export default function TermsPage() {
  return <LegalDocument title="Общи условия" intro={TERMS_INTRO} sections={TERMS_SECTIONS} />;
}
