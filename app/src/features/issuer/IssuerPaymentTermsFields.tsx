import { Select, SelectItem } from '@design/components';
import { getCountryConfig, PAYMENT_TERMS_DAY_OPTIONS } from '@fakturcho/shared-types';
import type { PaymentTermsDayOption } from '@shared/types';
import { useTranslations } from 'next-intl';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

const PAYMENT_TERMS_DAY_KEYS: Record<PaymentTermsDayOption, string> = {
  0: 'paymentTerms.dueOnReceipt',
  7: 'paymentTerms.days7',
  14: 'paymentTerms.days14',
  15: 'paymentTerms.days15',
  30: 'paymentTerms.days30',
  45: 'paymentTerms.days45',
  60: 'paymentTerms.days60',
};

const NONE_VALUE = 'none';

interface IssuerPaymentTermsFieldsProps {
  values: IssuerProfileFormValues;
  onChange: <K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) => void;
}

export function IssuerPaymentTermsFields({ values, onChange }: IssuerPaymentTermsFieldsProps) {
  const t = useTranslations('issuer');
  const maxDays = getCountryConfig(values.country).maxPaymentTermsDays;
  const dayOptions = PAYMENT_TERMS_DAY_OPTIONS.filter(
    (days): days is PaymentTermsDayOption => maxDays === undefined || days <= maxDays,
  );
  const selectValue =
    values.defaultPaymentTermsDays === null ? NONE_VALUE : String(values.defaultPaymentTermsDays);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t('paymentTerms.heading')}</h2>
      <Select
        label={t('paymentTerms.defaultLabel')}
        value={selectValue}
        onValueChange={(value) =>
          onChange('defaultPaymentTermsDays', value === NONE_VALUE ? null : Number(value))
        }
      >
        <SelectItem value={NONE_VALUE}>{t('paymentTerms.none')}</SelectItem>
        {dayOptions.map((days) => (
          <SelectItem key={days} value={String(days)}>
            {t(PAYMENT_TERMS_DAY_KEYS[days])}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
