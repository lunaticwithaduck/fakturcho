import { Input, Switch } from '@design/components';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

interface IssuerVatFieldsProps {
  values: IssuerProfileFormValues;
  onChange: <K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) => void;
}

export function IssuerVatFields({ values, onChange }: IssuerVatFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">ДДС регистрация</h2>
      <Switch
        label="Регистрация по ЗДДС"
        checked={values.vatRegistered}
        onCheckedChange={(checked) => onChange('vatRegistered', checked)}
      />
      {values.vatRegistered ? (
        <Input
          label="ДДС номер"
          required
          value={values.vatNumber}
          onChange={(event) => onChange('vatNumber', event.target.value)}
        />
      ) : null}
    </div>
  );
}
