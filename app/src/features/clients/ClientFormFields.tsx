import { Input, Select, SelectItem } from '@design/components';
import { EU_VAT_AREA_COUNTRIES, type Locale } from '@shared/types';
import { useTranslations } from 'next-intl';
import type { ClientFormValues } from './clientForm';

interface ClientFormFieldsProps {
  values: ClientFormValues;
  onChange: <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => void;
}

const OTHER_COUNTRY = 'OTHER';
const COUNTRY_OPTIONS = [...EU_VAT_AREA_COUNTRIES, OTHER_COUNTRY];
const SAME_AS_ISSUER = 'same';

export function ClientFormFields({ values, onChange }: ClientFormFieldsProps) {
  const t = useTranslations('clients');

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t('companyNameLabel')}
        required
        value={values.companyName}
        onChange={(event) => onChange('companyName', event.target.value)}
      />
      <Input
        label={t('eikOrBulstatLabel')}
        value={values.eik}
        onChange={(event) => onChange('eik', event.target.value)}
      />
      <Input
        label={t('vatNumberLabel')}
        value={values.vatNumber}
        onChange={(event) => onChange('vatNumber', event.target.value)}
      />
      <Input
        label={t('addressLabel')}
        value={values.address}
        onChange={(event) => onChange('address', event.target.value)}
      />
      <Select
        label={t('countryLabel')}
        value={values.country}
        onValueChange={(value) => onChange('country', value)}
      >
        {COUNTRY_OPTIONS.map((code) => (
          <SelectItem key={code} value={code}>
            {t(`countries.${code}`)}
          </SelectItem>
        ))}
      </Select>
      <Select
        label={t('documentLanguageLabel')}
        value={values.documentLanguage ?? SAME_AS_ISSUER}
        onValueChange={(value) =>
          onChange('documentLanguage', value === SAME_AS_ISSUER ? null : (value as Locale))
        }
      >
        <SelectItem value={SAME_AS_ISSUER}>{t('documentLanguageOptionSame')}</SelectItem>
        <SelectItem value="bg">{t('documentLanguageOptionBg')}</SelectItem>
        <SelectItem value="en">{t('documentLanguageOptionEn')}</SelectItem>
      </Select>
      <Input
        label={t('emailLabel')}
        type="email"
        value={values.email}
        onChange={(event) => onChange('email', event.target.value)}
      />
      <Input
        label={t('molLabel')}
        value={values.mol}
        onChange={(event) => onChange('mol', event.target.value)}
      />
      <Input
        label={t('peppolEndpointIdLabel')}
        value={values.peppolEndpointId}
        onChange={(event) => onChange('peppolEndpointId', event.target.value)}
      />
      <Input
        label={t('peppolSchemeLabel')}
        value={values.peppolScheme}
        onChange={(event) => onChange('peppolScheme', event.target.value)}
      />
    </div>
  );
}
