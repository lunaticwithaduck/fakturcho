import { Input } from '@design/components';
import type { ClientFormValues } from './clientForm';

interface ClientFormFieldsProps {
  values: ClientFormValues;
  onChange: <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => void;
}

export function ClientFormFields({ values, onChange }: ClientFormFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Фирма"
        required
        value={values.companyName}
        onChange={(event) => onChange('companyName', event.target.value)}
      />
      <Input
        label="ЕИК / Булстат"
        value={values.eik}
        onChange={(event) => onChange('eik', event.target.value)}
      />
      <Input
        label="ДДС номер"
        value={values.vatNumber}
        onChange={(event) => onChange('vatNumber', event.target.value)}
      />
      <Input
        label="Адрес"
        value={values.address}
        onChange={(event) => onChange('address', event.target.value)}
      />
      <Input
        label="Имейл"
        type="email"
        value={values.email}
        onChange={(event) => onChange('email', event.target.value)}
      />
      <Input
        label="МОЛ"
        value={values.mol}
        onChange={(event) => onChange('mol', event.target.value)}
      />
    </div>
  );
}
