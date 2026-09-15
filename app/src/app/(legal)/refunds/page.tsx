import { getFeatureFlags } from '@app/feature-flags';
import { LegalDocument } from '@app/features/legal/LegalDocument';
import { REFUND_INTRO, REFUND_SECTIONS } from '@app/features/legal/refundSections';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Възстановяване на суми',
  description: 'Кога и как Фактурчо възстановява платени суми.',
  alternates: {
    canonical: '/refunds',
    languages: {
      bg: '/refunds',
      en: '/en/refunds',
      'x-default': '/refunds',
    },
  },
};

export default async function RefundsPage() {
  const flags = await getFeatureFlags();
  return (
    <LegalDocument
      title="Политика за възстановяване на суми"
      intro={REFUND_INTRO}
      sections={REFUND_SECTIONS}
      currentPath="/refunds"
      enEnabled={flags.EN_LOCALE}
    />
  );
}
