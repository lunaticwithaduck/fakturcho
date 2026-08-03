import { MoneyInput } from '@app/features/shared/MoneyInput';
import { Input } from '@design/components';
import type { CatalogueFormValues } from './catalogueForm';

interface CatalogueFormFieldsProps {
  values: CatalogueFormValues;
  onChange: <K extends keyof CatalogueFormValues>(key: K, value: CatalogueFormValues[K]) => void;
}

export function CatalogueFormFields({ values, onChange }: CatalogueFormFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Наименование"
        required
        value={values.name}
        onChange={(event) => onChange('name', event.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Мярка"
          required
          placeholder="бр., час, кг..."
          value={values.unit}
          onChange={(event) => onChange('unit', event.target.value)}
        />
        <MoneyInput
          label="Цена по подразбиране"
          required
          value={values.defaultUnitPrice}
          onChange={(value) => onChange('defaultUnitPrice', value)}
        />
      </div>
    </div>
  );
}
