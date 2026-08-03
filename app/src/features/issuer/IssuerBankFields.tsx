import { Input } from '@design/components';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

interface IssuerBankFieldsProps {
  values: IssuerProfileFormValues;
  onChange: <K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) => void;
}

export function IssuerBankFields({ values, onChange }: IssuerBankFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">Банкова сметка</h2>
      <Input
        label="Банка"
        value={values.bankName}
        onChange={(event) => onChange('bankName', event.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="IBAN"
          value={values.iban}
          onChange={(event) => onChange('iban', event.target.value)}
        />
        <Input
          label="BIC"
          value={values.bic}
          onChange={(event) => onChange('bic', event.target.value)}
        />
      </div>
      <Input
        label="Алтернативна сметка"
        value={values.altIban}
        onChange={(event) => onChange('altIban', event.target.value)}
      />
    </div>
  );
}
