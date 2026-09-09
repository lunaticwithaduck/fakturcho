import { Input, Switch } from '@design/components';
import { useTranslations } from 'next-intl';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

interface IssuerVatFieldsProps {
  values: IssuerProfileFormValues;
  onChange: <K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) => void;
}

export function IssuerVatFields({ values, onChange }: IssuerVatFieldsProps) {
  const t = useTranslations('issuer');

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t('vatFields.heading')}</h2>
      <Switch
        label={t('vatFields.vatRegistered')}
        checked={values.vatRegistered}
        onCheckedChange={(checked) => onChange('vatRegistered', checked)}
      />
      {values.vatRegistered ? (
        <Input
          label={t('vatFields.vatNumber')}
          required
          value={values.vatNumber}
          onChange={(event) => onChange('vatNumber', event.target.value)}
        />
      ) : null}
    </div>
  );
}
