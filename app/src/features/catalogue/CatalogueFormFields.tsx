import { MoneyInput } from '@app/features/shared/MoneyInput';
import { Input, Select, SelectItem } from '@design/components';
import { UNIT_CODES } from '@fakturcho/shared-types';
import { useTranslations } from 'next-intl';
import type { CatalogueFormValues } from './catalogueForm';

const NO_UNIT_CODE = 'none';

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
      <Select
        label={t('unitCodeLabel')}
        value={values.unitCode ?? NO_UNIT_CODE}
        onValueChange={(value) => onChange('unitCode', value === NO_UNIT_CODE ? null : value)}
      >
        <SelectItem value={NO_UNIT_CODE}>{t('unitCodeNoneOption')}</SelectItem>
        {UNIT_CODES.map((code) => (
          <SelectItem key={code} value={code}>
            {t(`units.${code}`)}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
