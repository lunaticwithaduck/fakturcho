import { useCreateClientMutation, useUpdateClientMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import type { ClientDto, CreateClientRequest } from '@shared/types';
import { type FormEvent, useState } from 'react';

export interface ClientFormValues {
  companyName: string;
  eik: string;
  vatNumber: string;
  address: string;
  email: string;
  mol: string;
}

export function clientToFormValues(client: ClientDto | null): ClientFormValues {
  return {
    companyName: client?.companyName ?? '',
    eik: client?.eik ?? '',
    vatNumber: client?.vatNumber ?? '',
    address: client?.address ?? '',
    email: client?.email ?? '',
    mol: client?.mol ?? '',
  };
}

function toRequestBody(values: ClientFormValues): CreateClientRequest {
  return {
    companyName: values.companyName.trim(),
    eik: values.eik.trim() || null,
    vatNumber: values.vatNumber.trim() || null,
    address: values.address.trim() || null,
    email: values.email.trim() || null,
    mol: values.mol.trim() || null,
  };
}

export function useClientForm(client: ClientDto | null, onSaved: (client: ClientDto) => void) {
  const [values, setValues] = useState<ClientFormValues>(() => clientToFormValues(client));
  const [error, setError] = useState<string | null>(null);
  const [createClient, createState] = useCreateClientMutation();
  const [updateClient, updateState] = useUpdateClientMutation();

  function setField<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const body = toRequestBody(values);
    try {
      const result = client
        ? await updateClient({ id: client.id, body }).unwrap()
        : await createClient(body).unwrap();
      onSaved(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return {
    values,
    setField,
    error,
    isSubmitting: createState.isLoading || updateState.isLoading,
    handleSubmit,
  };
}
