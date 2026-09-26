'use client';

import { todayIsoDate } from '@app/features/shared/format';
import { Input, Select, SelectItem } from '@design/components';
import type { DocumentType, PaymentTermsDayOption } from '@shared/types';
import { useTranslations } from 'next-intl';
import { addDaysToIsoDate, paymentTermsDayOptionsUpTo } from './composerPaymentTermsState';

const PAYMENT_TERMS_DAY_KEYS: Record<PaymentTermsDayOption, string> = {
  0: 'composer.paymentTerms.dueOnReceipt',
  7: 'composer.paymentTerms.days7',
  14: 'composer.paymentTerms.days14',
  15: 'composer.paymentTerms.days15',
  30: 'composer.paymentTerms.days30',
  45: 'composer.paymentTerms.days45',
  60: 'composer.paymentTerms.days60',
};

const CUSTOM_DUE_DATE = 'custom';

interface ComposerDetailsFieldsProps {
  documentType: DocumentType;
  referenceNumber: string;
  taxEventAt: string;
  dueAt: string;
  paymentTermsDays: number | null;
  maxPaymentTermsDays?: number;
  validUntil: string;
  onChange: (patch: {
    referenceNumber?: string;
    taxEventAt?: string;
    dueAt?: string;
    paymentTermsDays?: number | null;
    validUntil?: string;
  }) => void;
}

export function ComposerDetailsFields({
  documentType,
  referenceNumber,
  taxEventAt,
  dueAt,
  paymentTermsDays,
  maxPaymentTermsDays,
  validUntil,
  onChange,
}: ComposerDetailsFieldsProps) {
  const t = useTranslations('documents');
  const isQuote = documentType === 'quote';
  const isDeliveryNote = documentType === 'delivery_note';
  const dayOptions = paymentTermsDayOptionsUpTo(maxPaymentTermsDays);
  const paymentTermsValue = paymentTermsDays === null ? CUSTOM_DUE_DATE : String(paymentTermsDays);

  function handlePaymentTermsSelect(value: string) {
    if (value === CUSTOM_DUE_DATE) {
      onChange({ paymentTermsDays: null });
      return;
    }
    const days = Number(value);
    onChange({ paymentTermsDays: days, dueAt: addDaysToIsoDate(todayIsoDate(), days) });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label={t('composer.details.referenceNumber')}
        value={referenceNumber}
        onChange={(event) => onChange({ referenceNumber: event.target.value })}
      />
      {isQuote ? (
        <Input
          label={t('composer.details.validUntil')}
          type="date"
          value={validUntil}
          onChange={(event) => onChange({ validUntil: event.target.value })}
        />
      ) : isDeliveryNote ? null : (
        <>
          <Input
            label={t('composer.details.taxEventAt')}
            type="date"
            value={taxEventAt}
            onChange={(event) => onChange({ taxEventAt: event.target.value })}
          />
          <Select
            label={t('composer.paymentTerms.label')}
            value={paymentTermsValue}
            onValueChange={handlePaymentTermsSelect}
          >
            {dayOptions.map((days) => (
              <SelectItem key={days} value={String(days)}>
                {t(PAYMENT_TERMS_DAY_KEYS[days])}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_DUE_DATE}>{t('composer.paymentTerms.customDate')}</SelectItem>
          </Select>
          {paymentTermsDays === null ? (
            <Input
              label={t('composer.details.dueAt')}
              type="date"
              value={dueAt}
              onChange={(event) => onChange({ dueAt: event.target.value })}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
