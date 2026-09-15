import type { FeatureFlagKey } from '@fakturcho/shared-types';

export const FEATURE_FLAG_LABELS: Record<FeatureFlagKey, { title: string; description: string }> = {
  EN_LOCALE: {
    title: 'Английски език',
    description:
      'Включва английския интерфейс, /en/ маршрутите и превода на документи и имейли на английски.',
  },
  EINVOICE: {
    title: 'Е-фактура (XML)',
    description: 'Включва проверката за готовност и изтеглянето на UBL XML за документите.',
  },
  PEPPOL: {
    title: 'Изпращане през Peppol',
    description: 'Включва изпращането на е-фактурата през Peppol и статуса на доставка.',
  },
};
