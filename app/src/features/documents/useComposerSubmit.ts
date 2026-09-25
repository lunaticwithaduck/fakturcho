import { useSaveDraftMutation, useUpdateDraftMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { toast } from '@design/components';
import type { DocumentDto, Locale } from '@shared/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { type ComposerFormState, toSaveDraftRequest } from './composerState';
import { validateComposerState } from './composerValidation';
import type { VatTreatment } from './liveTotals';

export function useComposerSubmit(
  documentId: string | null,
  state: ComposerFormState,
  vat: VatTreatment,
  locale: Locale,
  issuerCountry = '',
) {
  const t = useTranslations('documents');
  const router = useRouter();
  const [saveDraft, saveDraftState] = useSaveDraftMutation();
  const [updateDraft, updateDraftState] = useUpdateDraftMutation();
  const [error, setError] = useState<string | null>(null);

  async function persist(): Promise<DocumentDto | null> {
    setError(null);
    const validationError = validateComposerState(state, vat, issuerCountry);
    if (validationError) {
      setError(t(`composer.errors.${validationError}`));
      return null;
    }
    const body = toSaveDraftRequest(state, vat, issuerCountry);
    try {
      return documentId
        ? await updateDraft({ id: documentId, body }).unwrap()
        : await saveDraft(body).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, locale));
      return null;
    }
  }

  async function handleSaveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await persist();
    if (result) {
      toast({ title: t('composer.draftSaved') });
      router.push(`/documents/${result.id}`);
    }
  }

  async function handleSaveAndIssue() {
    const result = await persist();
    if (result) router.push(`/documents/${result.id}?issue=1`);
  }

  return {
    error,
    isSubmitting: saveDraftState.isLoading || updateDraftState.isLoading,
    handleSaveDraft,
    handleSaveAndIssue,
  };
}
