import { LegalDocument } from '@app/features/legal/LegalDocument';
import { REFUND_INTRO, REFUND_SECTIONS } from '@app/features/legal/refundSections';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Възстановяване на суми — Фактурчо',
  description: 'Кога и как Фактурчо възстановява платени суми.',
};

export default function RefundsPage() {
  return (
    <LegalDocument
      title="Политика за възстановяване на суми"
      intro={REFUND_INTRO}
      sections={REFUND_SECTIONS}
    />
  );
}
