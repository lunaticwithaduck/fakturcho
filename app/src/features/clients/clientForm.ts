import { useCreateClientMutation, useUpdateClientMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import {
  type ClientDto,
  type CreateClientRequest,
  type DocumentLanguage,
  getCountryConfig,
  type Locale,
} from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

export interface ClientFormValues {
  companyName: string;
  eik: string;
  vatNumber: string;
  address: string;
  street: string;
  postcode: string;
  countyRegion: string;
  city: string;
  email: string;
  mol: string;
  country: string;
  documentLanguage: DocumentLanguage | null;
  peppolEndpointId: string;
  peppolScheme: string;
}

export function usesStructuredClientAddress(country: string): boolean {
  return getCountryConfig(country).requiredIssuerFields.includes('street');
}

export function clientToFormValues(client: ClientDto | null): ClientFormValues {
  return {
    companyName: client?.companyName ?? '',
    eik: client?.eik ?? '',
    vatNumber: client?.vatNumber ?? '',
    address: client?.address ?? '',
    street: client?.street ?? '',
    postcode: client?.postcode ?? '',
    countyRegion: client?.countyRegion ?? '',
    city: client?.city ?? '',
    email: client?.email ?? '',
    mol: client?.mol ?? '',
    country: client?.country ?? 'BG',
    documentLanguage: client?.documentLanguage ?? null,
    peppolEndpointId: client?.peppolEndpointId ?? '',
    peppolScheme: client?.peppolScheme ?? '',
  };
}

function toRequestBody(values: ClientFormValues): CreateClientRequest {
  const structuredAddress = usesStructuredClientAddress(values.country);
  const street = structuredAddress ? values.street.trim() || null : null;
  const postcode = structuredAddress ? values.postcode.trim() || null : null;
  const address = structuredAddress
    ? [street, postcode].filter(Boolean).join(', ') || null
    : values.address.trim() || null;
  const countyRegion = getCountryConfig(values.country).countyRegion
    ? values.countyRegion.trim() || null
    : null;

  return {
    companyName: values.companyName.trim(),
    eik: values.eik.trim() || null,
    vatNumber: values.vatNumber.trim() || null,
    address,
    street,
    postcode,
    countyRegion,
    city: values.city.trim() || null,
    email: values.email.trim() || null,
    mol: values.mol.trim() || null,
    country: values.country,
    documentLanguage: values.documentLanguage,
    peppolEndpointId: values.peppolEndpointId.trim() || null,
    peppolScheme: values.peppolScheme.trim() || null,
  };
}

export interface ClientFieldErrors {
  countyRegion?: string;
}

export function computeClientFieldErrors(values: ClientFormValues): ClientFieldErrors {
  const config = getCountryConfig(values.country);
  const countyRegion = values.countyRegion.trim();
  if (
    countyRegion &&
    config.countyRegion?.pattern &&
    !config.countyRegion.pattern.test(countyRegion)
  ) {
    return { countyRegion: config.countyRegion.label };
  }
  return {};
}

export function useClientForm(client: ClientDto | null, onSaved: (client: ClientDto) => void) {
  const locale = useLocale() as Locale;
  const t = useTranslations('clients');
  const [values, setValues] = useState<ClientFormValues>(() => clientToFormValues(client));
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [createClient, createState] = useCreateClientMutation();
  const [updateClient, updateState] = useUpdateClientMutation();
  const fieldErrors = computeClientFieldErrors(values);

  function setField<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    if (key === 'country') {
      const nextCountry = value as string;
      setValues((previous) => {
        const structuredAfter = usesStructuredClientAddress(nextCountry);
        const hasCountyRegion = !!getCountryConfig(nextCountry).countyRegion;
        return {
          ...previous,
          country: nextCountry,
          address: structuredAfter ? '' : previous.address,
          street: structuredAfter ? previous.street : '',
          postcode: structuredAfter ? previous.postcode : '',
          countyRegion: hasCountyRegion ? previous.countyRegion : '',
        };
      });
      return;
    }
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (fieldErrors.countyRegion) {
      setError(t('invalidFormat'));
      return;
    }
    setError(null);
    const body = toRequestBody(values);
    try {
      const result = client
        ? await updateClient({ id: client.id, body }).unwrap()
        : await createClient(body).unwrap();
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
    isSubmitting: createState.isLoading || updateState.isLoading,
    handleSubmit,
    fieldErrors: submitAttempted ? fieldErrors : {},
  };
}
