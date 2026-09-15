import { Input } from '@design/components';
import { useTranslations } from 'next-intl';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

interface IssuerBankFieldsProps {
  values: IssuerProfileFormValues;
  onChange: <K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) => void;
}

export function IssuerBankFields({ values, onChange }: IssuerBankFieldsProps) {
  const t = useTranslations('issuer');

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t('bankFields.heading')}</h2>
      <Input
        label={t('bankFields.bankName')}
        value={values.bankName}
        onChange={(event) => onChange('bankName', event.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('bankFields.iban')}
          value={values.iban}
          onChange={(event) => onChange('iban', event.target.value)}
        />
        <Input
          label={t('bankFields.bic')}
          value={values.bic}
          onChange={(event) => onChange('bic', event.target.value)}
        />
      </div>
      <Input
        label={t('bankFields.altIban')}
        value={values.altIban}
        onChange={(event) => onChange('altIban', event.target.value)}
      />
    </div>
  );
}
