import { useUpdateIssuerProfileMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import type { IssuerProfileDto, UpdateIssuerProfileRequest } from '@shared/types';
import { type FormEvent, useState } from 'react';

export interface IssuerProfileFormValues {
  companyName: string;
  eik: string;
  mol: string;
  addressLine: string;
  city: string;
  phone: string;
  vatRegistered: boolean;
  vatNumber: string;
  bankName: string;
  iban: string;
  bic: string;
  altIban: string;
}

function toValues(profile: IssuerProfileDto): IssuerProfileFormValues {
  return {
    companyName: profile.companyName ?? '',
    eik: profile.eik ?? '',
    mol: profile.mol ?? '',
    addressLine: profile.addressLine ?? '',
    city: profile.city ?? '',
    phone: profile.phone ?? '',
    vatRegistered: profile.vatRegistered,
    vatNumber: profile.vatNumber ?? '',
    bankName: profile.bankName ?? '',
    iban: profile.iban ?? '',
    bic: profile.bic ?? '',
    altIban: profile.altIban ?? '',
  };
}

function toRequestBody(values: IssuerProfileFormValues): UpdateIssuerProfileRequest {
  return {
    companyName: values.companyName.trim() || null,
    eik: values.eik.trim() || null,
    mol: values.mol.trim() || null,
    addressLine: values.addressLine.trim() || null,
    city: values.city.trim() || null,
    phone: values.phone.trim() || null,
    vatRegistered: values.vatRegistered,
    vatNumber: values.vatRegistered ? values.vatNumber.trim() || null : null,
    bankName: values.bankName.trim() || null,
    iban: values.iban.trim() || null,
    bic: values.bic.trim() || null,
    altIban: values.altIban.trim() || null,
  };
}

export function useIssuerProfileForm(
  profile: IssuerProfileDto,
  onSaved: (profile: IssuerProfileDto) => void,
) {
  const [values, setValues] = useState<IssuerProfileFormValues>(() => toValues(profile));
  const [error, setError] = useState<string | null>(null);
  const [updateProfile, { isLoading }] = useUpdateIssuerProfileMutation();

  function setField<K extends keyof IssuerProfileFormValues>(
    key: K,
    value: IssuerProfileFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const result = await updateProfile(toRequestBody(values)).unwrap();
      setValues(toValues(result));
      onSaved(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return { values, setField, error, isSubmitting: isLoading, handleSubmit };
}
