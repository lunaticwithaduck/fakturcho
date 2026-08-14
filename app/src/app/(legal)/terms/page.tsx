import { LegalDocument } from '@app/features/legal/LegalDocument';
import { TERMS_INTRO, TERMS_SECTIONS } from '@app/features/legal/termsSections';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Общи условия — Фактурчо',
  description: 'Общите условия за ползване на Фактурчо.',
};

export default function TermsPage() {
  return <LegalDocument title="Общи условия" intro={TERMS_INTRO} sections={TERMS_SECTIONS} />;
}
