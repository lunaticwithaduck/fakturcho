import { Input, Select, SelectItem } from '@design/components';
import {
  companyIdLabelFor,
  DOCUMENT_LANGUAGES,
  type DocumentLanguage,
  EU_VAT_AREA_COUNTRIES,
  getCountryConfig,
  type Locale,
} from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';
import {
  type ClientFieldErrors,
  type ClientFormValues,
  usesStructuredClientAddress,
} from './clientForm';

interface ClientFormFieldsProps {
  values: ClientFormValues;
  onChange: <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => void;
  fieldErrors?: ClientFieldErrors;
}

const OTHER_COUNTRY = 'OTHER';
const COUNTRY_OPTIONS = [...EU_VAT_AREA_COUNTRIES, OTHER_COUNTRY];
const SAME_AS_ISSUER = 'same';

export function ClientFormFields({ values, onChange, fieldErrors = {} }: ClientFormFieldsProps) {
  const t = useTranslations('clients');
  const locale = useLocale() as Locale;
  const structuredAddress = usesStructuredClientAddress(values.country);
  const { countyRegion } = getCountryConfig(values.country);
  const companyIdLabel = companyIdLabelFor(values.country, locale);

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t('companyNameLabel')}
        required
        value={values.companyName}
        onChange={(event) => onChange('companyName', event.target.value)}
      />
      <Input
        label={companyIdLabel}
        value={values.eik}
        onChange={(event) => onChange('eik', event.target.value)}
      />
      <Input
        label={t('vatNumberLabel')}
        value={values.vatNumber}
        onChange={(event) => onChange('vatNumber', event.target.value)}
      />
      {structuredAddress ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('streetLabel')}
            value={values.street}
            onChange={(event) => onChange('street', event.target.value)}
          />
          <Input
            label={t('postcodeLabel')}
            value={values.postcode}
            onChange={(event) => onChange('postcode', event.target.value)}
          />
        </div>
      ) : (
        <Input
          label={t('addressLabel')}
          value={values.address}
          onChange={(event) => onChange('address', event.target.value)}
        />
      )}
      <Input
        label={t('cityLabel')}
        value={values.city}
        onChange={(event) => onChange('city', event.target.value)}
      />
      {countyRegion ? (
        <Input
          label={countyRegion.label}
          required={countyRegion.required}
          value={values.countyRegion}
          onChange={(event) => onChange('countyRegion', event.target.value)}
          {...(fieldErrors.countyRegion ? { error: t('invalidFormat') } : {})}
        />
      ) : null}
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
          onChange(
            'documentLanguage',
            value === SAME_AS_ISSUER ? null : (value as DocumentLanguage),
          )
        }
      >
        <SelectItem value={SAME_AS_ISSUER}>{t('documentLanguageOptionSame')}</SelectItem>
        {DOCUMENT_LANGUAGES.map((language) => (
          <SelectItem key={language} value={language}>
            {t(`documentLanguageOptions.${language}`)}
          </SelectItem>
        ))}
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
