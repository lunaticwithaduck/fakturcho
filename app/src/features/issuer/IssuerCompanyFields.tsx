import { Checkbox, Input, Select, SelectItem } from '@design/components';
import {
  companyIdLabelFor,
  getCountryConfig,
  isAtJungholzMittelbergPostcode,
  type Locale,
} from '@fakturcho/shared-types';
import { useLocale, useTranslations } from 'next-intl';
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
  const locale = useLocale() as Locale;
  const { requiredIssuerFields, identifiers, countyRegion } = getCountryConfig(values.country);
  const companyIdLabel = companyIdLabelFor(values.country, locale);
  const isRequired = (field: string) => requiredIssuerFields.includes(field);
  const invalidFormat = t('companyFields.invalidFormat');
  // § 37a HGB, § 35a GmbHG: Registergericht and Sitz become required once a
  // Handelsregisternummer (eik) is entered — kept in sync with
  // issuerCompleteness.ts and isIssuerProfileComplete. UGB § 14 Abs. 1: same
  // rule for AT's Firmenbuchgericht/Sitz once a Firmenbuchnummer is entered.
  const isIdentifierRequired = (field: { key: string; required: boolean }) =>
    field.required ||
    (values.country === 'DE' &&
      (field.key === 'registergericht' || field.key === 'sitz') &&
      values.eik.trim() !== '') ||
    (values.country === 'AT' &&
      (field.key === 'firmenbuchgericht' || field.key === 'sitz') &&
      values.eik.trim() !== '');
  // § 10 Abs. 4 UStG 1994: pre-tick 19% instead of 20% once the issuer's own
  // postcode is Jungholz/Mittelberg, but only until the issuer says otherwise
  // — an explicit 'true'/'false' always wins over the postcode-based guess.
  const isFlagChecked = (field: { key: string }): boolean => {
    const stored = values.identifiers[field.key];
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return (
      values.country === 'AT' &&
      field.key === 'jungholzMittelbergRate' &&
      isAtJungholzMittelbergPostcode(values.postcode)
    );
  };

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
          label={companyIdLabel}
          required={isRequired('eik')}
          value={values.eik}
          onChange={(event) => onChange('eik', event.target.value)}
        />
      </div>
      {identifiers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {identifiers.map((field) =>
            field.kind === 'flag' ? (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Checkbox
                  label={field.label}
                  checked={isFlagChecked(field)}
                  onCheckedChange={(checked) =>
                    onChange('identifiers', {
                      ...values.identifiers,
                      [field.key]: checked === true ? 'true' : 'false',
                    })
                  }
                />
                {values.country === 'AT' && field.key === 'jungholzMittelbergRate' ? (
                  <p className="text-sm text-text-muted">
                    {t('companyFields.atJungholzMittelbergHint')}
                  </p>
                ) : null}
              </div>
            ) : (
              <Input
                key={field.key}
                label={field.label}
                required={isIdentifierRequired(field)}
                value={values.identifiers[field.key] ?? ''}
                onChange={(event) =>
                  onChange('identifiers', {
                    ...values.identifiers,
                    [field.key]: event.target.value,
                  })
                }
                {...(values.country === 'CZ' && field.key === 'companyRegister'
                  ? { hint: t('companyFields.czRegisterHint') }
                  : {})}
                {...(values.country === 'FR' && field.key === 'legalForm'
                  ? { hint: t('companyFields.frLegalFormHint') }
                  : {})}
                {...(fieldErrors.identifiers[field.key] ? { error: invalidFormat } : {})}
              />
            ),
          )}
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
