import { useUpdateIssuerProfileMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { getCountryConfig } from '@fakturcho/shared-types';
import type { IssuerProfileDto, Locale, UpdateIssuerProfileRequest } from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

export interface IssuerProfileFormValues {
  companyName: string;
  eik: string;
  mol: string;
  addressLine: string;
  street: string;
  postcode: string;
  countyRegion: string;
  city: string;
  country: string;
  phone: string;
  vatRegistered: boolean;
  vatNumber: string;
  bankName: string;
  iban: string;
  bic: string;
  altIban: string;
  identifiers: Record<string, string>;
}

function toValues(profile: IssuerProfileDto): IssuerProfileFormValues {
  return {
    companyName: profile.companyName ?? '',
    eik: profile.eik ?? '',
    mol: profile.mol ?? '',
    addressLine: profile.addressLine ?? '',
    street: profile.street ?? '',
    postcode: profile.postcode ?? '',
    countyRegion: profile.countyRegion ?? '',
    city: profile.city ?? '',
    country: profile.country,
    phone: profile.phone ?? '',
    vatRegistered: profile.vatRegistered,
    vatNumber: profile.vatNumber ?? '',
    bankName: profile.bankName ?? '',
    iban: profile.iban ?? '',
    bic: profile.bic ?? '',
    altIban: profile.altIban ?? '',
    identifiers: { ...profile.identifiers },
  };
}

function toRequestBody(values: IssuerProfileFormValues): UpdateIssuerProfileRequest {
  return {
    companyName: values.companyName.trim() || null,
    eik: values.eik.trim() || null,
    mol: values.mol.trim() || null,
    addressLine: values.addressLine.trim() || null,
    street: values.street.trim() || null,
    postcode: values.postcode.trim() || null,
    countyRegion: values.countyRegion.trim() || null,
    city: values.city.trim() || null,
    country: values.country,
    phone: values.phone.trim() || null,
    vatRegistered: values.vatRegistered,
    vatNumber: values.vatRegistered ? values.vatNumber.trim() || null : null,
    bankName: values.bankName.trim() || null,
    iban: values.iban.trim() || null,
    bic: values.bic.trim() || null,
    altIban: values.altIban.trim() || null,
    identifiers: Object.fromEntries(
      Object.entries(values.identifiers)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value !== ''),
    ),
  };
}

export interface IssuerProfileFieldErrors {
  countyRegion?: string;
  identifiers: Record<string, string>;
}

export function computeIssuerFieldErrors(
  values: IssuerProfileFormValues,
): IssuerProfileFieldErrors {
  const config = getCountryConfig(values.country);
  const errors: IssuerProfileFieldErrors = { identifiers: {} };

  const countyRegion = values.countyRegion.trim();
  if (
    countyRegion &&
    config.countyRegion?.pattern &&
    !config.countyRegion.pattern.test(countyRegion)
  ) {
    errors.countyRegion = config.countyRegion.label;
  }

  for (const field of config.identifiers) {
    const value = values.identifiers[field.key]?.trim();
    if (value && field.pattern && !field.pattern.test(value)) {
      errors.identifiers[field.key] = field.label;
    }
  }

  return errors;
}

export function hasIssuerFieldErrors(errors: IssuerProfileFieldErrors): boolean {
  return !!errors.countyRegion || Object.keys(errors.identifiers).length > 0;
}

export function useIssuerProfileForm(
  profile: IssuerProfileDto,
  onSaved: (profile: IssuerProfileDto) => void,
) {
  const locale = useLocale() as Locale;
  const t = useTranslations('issuer');
  const [values, setValues] = useState<IssuerProfileFormValues>(() => toValues(profile));
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [updateProfile, { isLoading }] = useUpdateIssuerProfileMutation();
  const fieldErrors = computeIssuerFieldErrors(values);

  function setField<K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (hasIssuerFieldErrors(fieldErrors)) {
      setError(t('companyFields.invalidFormat'));
      return;
    }
    setError(null);
    try {
      const result = await updateProfile(toRequestBody(values)).unwrap();
      setValues(toValues(result));
      setSubmitAttempted(false);
      onSaved(result);
    } catch (err) {
      setError(getApiErrorMessage(err, locale));
    }
  }

  return {
    values,
    setField,
    error,
    isSubmitting: isLoading,
    handleSubmit,
    fieldErrors: submitAttempted ? fieldErrors : { identifiers: {} },
  };
}
