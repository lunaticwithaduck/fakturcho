import { Input, Select, SelectItem } from '@design/components';
import { getCountryConfig } from '@fakturcho/shared-types';
import { useTranslations } from 'next-intl';
import { ISSUER_COUNTRY_CODES } from './issuerCountries';
import type { IssuerProfileFieldErrors, IssuerProfileFormValues } from './useIssuerProfileForm';

interface IssuerCompanyFieldsProps {
  values: IssuerProfileFormValues;
  onChange: <K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) => void;
  fieldErrors?: IssuerProfileFieldErrors;
}

export function IssuerCompanyFields({
  values,
  onChange,
  fieldErrors = { identifiers: {} },
}: IssuerCompanyFieldsProps) {
  const t = useTranslations('issuer');
  const { requiredIssuerFields, identifiers, companyIdLabel, countyRegion } = getCountryConfig(
    values.country,
  );
  const isRequired = (field: string) => requiredIssuerFields.includes(field);
  const invalidFormat = t('companyFields.invalidFormat');

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t('companyFields.heading')}</h2>
      <Input
        label={t('companyFields.companyName')}
        required
        value={values.companyName}
        onChange={(event) => onChange('companyName', event.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label={t('companyFields.country')}
          value={values.country}
          onValueChange={(next) => onChange('country', next)}
        >
          {ISSUER_COUNTRY_CODES.map((code) => (
            <SelectItem key={code} value={code}>
              {t(`countries.${code}`)}
            </SelectItem>
          ))}
        </Select>
        <Input
          label={values.country === 'BG' ? t('companyFields.eik') : companyIdLabel}
          required={isRequired('eik')}
          value={values.eik}
          onChange={(event) => onChange('eik', event.target.value)}
        />
      </div>
      {identifiers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {identifiers.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              required={field.required}
              value={values.identifiers[field.key] ?? ''}
              onChange={(event) =>
                onChange('identifiers', { ...values.identifiers, [field.key]: event.target.value })
              }
              {...(fieldErrors.identifiers[field.key] ? { error: invalidFormat } : {})}
            />
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('companyFields.mol')}
          value={values.mol}
          onChange={(event) => onChange('mol', event.target.value)}
        />
        <Input
          label={t('companyFields.city')}
          required={isRequired('city')}
          value={values.city}
          onChange={(event) => onChange('city', event.target.value)}
        />
      </div>
      {isRequired('addressLine') ? (
        <Input
          label={t('companyFields.addressLine')}
          required
          value={values.addressLine}
          onChange={(event) => onChange('addressLine', event.target.value)}
        />
      ) : null}
      {isRequired('street') || isRequired('postcode') ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isRequired('street') ? (
            <Input
              label={t('companyFields.street')}
              required
              value={values.street}
              onChange={(event) => onChange('street', event.target.value)}
            />
          ) : null}
          {isRequired('postcode') ? (
            <Input
              label={t('companyFields.postcode')}
              required
              value={values.postcode}
              onChange={(event) => onChange('postcode', event.target.value)}
            />
          ) : null}
        </div>
      ) : null}
      {countyRegion ? (
        <Input
          label={countyRegion.label}
          required={countyRegion.required}
          value={values.countyRegion}
          onChange={(event) => onChange('countyRegion', event.target.value)}
          {...(fieldErrors.countyRegion ? { error: invalidFormat } : {})}
        />
      ) : null}
      <Input
        label={t('companyFields.phone')}
        value={values.phone}
        onChange={(event) => onChange('phone', event.target.value)}
      />
    </div>
  );
}
