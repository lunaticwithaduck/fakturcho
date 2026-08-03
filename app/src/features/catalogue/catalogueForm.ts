import { useCreateCatalogueItemMutation, useUpdateCatalogueItemMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import type { CatalogueItemDto, Cents, CreateCatalogueItemRequest } from '@shared/types';
import { type FormEvent, useState } from 'react';

export interface CatalogueFormValues {
  name: string;
  unit: string;
  defaultUnitPrice: Cents | null;
}

export function catalogueItemToFormValues(item: CatalogueItemDto | null): CatalogueFormValues {
  return {
    name: item?.name ?? '',
    unit: item?.unit ?? 'бр.',
    defaultUnitPrice: item?.defaultUnitPrice ?? null,
  };
}

function isValid(values: CatalogueFormValues): boolean {
  return values.name.trim() !== '' && values.unit.trim() !== '' && values.defaultUnitPrice !== null;
}

function toRequestBody(values: CatalogueFormValues): CreateCatalogueItemRequest {
  return {
    name: values.name.trim(),
    unit: values.unit.trim(),
    defaultUnitPrice: values.defaultUnitPrice ?? 0,
  };
}

export function useCatalogueForm(
  item: CatalogueItemDto | null,
  onSaved: (item: CatalogueItemDto) => void,
) {
  const [values, setValues] = useState<CatalogueFormValues>(() => catalogueItemToFormValues(item));
  const [error, setError] = useState<string | null>(null);
  const [createItem, createState] = useCreateCatalogueItemMutation();
  const [updateItem, updateState] = useUpdateCatalogueItemMutation();

  function setField<K extends keyof CatalogueFormValues>(key: K, value: CatalogueFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!isValid(values)) {
      setError('Попълнете наименование, мярка и цена.');
      return;
    }
    const body = toRequestBody(values);
    try {
      const result = item
        ? await updateItem({ id: item.id, body }).unwrap()
        : await createItem(body).unwrap();
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
