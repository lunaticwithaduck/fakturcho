import { Input } from '@design/components';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

interface IssuerCompanyFieldsProps {
  values: IssuerProfileFormValues;
  onChange: <K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) => void;
}

export function IssuerCompanyFields({ values, onChange }: IssuerCompanyFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">Фирмени данни</h2>
      <Input
        label="Фирма"
        required
        value={values.companyName}
        onChange={(event) => onChange('companyName', event.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="ЕИК / Булстат"
          required
          value={values.eik}
          onChange={(event) => onChange('eik', event.target.value)}
        />
        <Input
          label="МОЛ"
          value={values.mol}
          onChange={(event) => onChange('mol', event.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Адрес"
          required
          value={values.addressLine}
          onChange={(event) => onChange('addressLine', event.target.value)}
        />
        <Input
          label="Град"
          required
          value={values.city}
          onChange={(event) => onChange('city', event.target.value)}
        />
      </div>
      <Input
        label="Телефон"
        value={values.phone}
        onChange={(event) => onChange('phone', event.target.value)}
      />
    </div>
  );
}
