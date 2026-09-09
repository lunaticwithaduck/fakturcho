import { MoneyInput } from '@app/features/shared/MoneyInput';
import { Input } from '@design/components';
import { useTranslations } from 'next-intl';
import type { CatalogueFormValues } from './catalogueForm';

interface CatalogueFormFieldsProps {
  values: CatalogueFormValues;
  onChange: <K extends keyof CatalogueFormValues>(key: K, value: CatalogueFormValues[K]) => void;
}

export function CatalogueFormFields({ values, onChange }: CatalogueFormFieldsProps) {
  const t = useTranslations('catalogue');

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t('nameLabel')}
        required
        value={values.name}
        onChange={(event) => onChange('name', event.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('unitLabel')}
          required
          placeholder={t('unitPlaceholder')}
          value={values.unit}
          onChange={(event) => onChange('unit', event.target.value)}
        />
        <MoneyInput
          label={t('priceLabel')}
          required
          value={values.defaultUnitPrice}
          onChange={(value) => onChange('defaultUnitPrice', value)}
        />
      </div>
    </div>
  );
}
