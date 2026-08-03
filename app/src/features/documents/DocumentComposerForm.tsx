'use client';

import { useSaveDraftMutation, useUpdateDraftMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { Card, toast } from '@design/components';
import { CORRECTION_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type {
  CatalogueItemDto,
  ClientDto,
  DocumentDto,
  DocumentType,
  IssuerProfileDto,
} from '@shared/types';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { ComposerActions } from './ComposerActions';
import { ComposerClientField } from './ComposerClientField';
import { ComposerDetailsFields } from './ComposerDetailsFields';
import { ComposerDiscountsList } from './ComposerDiscountsList';
import { ComposerDocumentTypeField } from './ComposerDocumentTypeField';
import { ComposerLineItemsTable } from './ComposerLineItemsTable';
import { ComposerNotesFields } from './ComposerNotesFields';
import { ComposerOriginalDocumentField } from './ComposerOriginalDocumentField';
import { ComposerTotalsPanel } from './ComposerTotalsPanel';
import { ComposerVatSection } from './ComposerVatSection';
import { toSaveDraftRequest, validateComposerState } from './composerState';
import { computeLiveTotals, resolveVatTreatment } from './liveTotals';
import { useComposerState } from './useComposerState';

interface DocumentComposerFormProps {
  documentId: string | null;
  existing: DocumentDto | null;
  clients: readonly ClientDto[];
  catalogueItems: readonly CatalogueItemDto[];
  issuerProfile: IssuerProfileDto;
}

export function DocumentComposerForm({
  documentId,
  existing,
  clients,
  catalogueItems,
  issuerProfile,
}: DocumentComposerFormProps) {
  const router = useRouter();
  const controller = useComposerState(existing);
  const { state, setField, patchState } = controller;
  const [saveDraft, saveDraftState] = useSaveDraftMutation();
  const [updateDraft, updateDraftState] = useUpdateDraftMutation();
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = saveDraftState.isLoading || updateDraftState.isLoading;

  const vat = resolveVatTreatment({
    documentType: state.documentType,
    vatRegistered: issuerProfile.vatRegistered,
    chargeVat: state.chargeVat,
  });
  const totals = computeLiveTotals({
    lineItems: state.lineItems.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? 0,
    })),
    discounts: state.discounts.map((discount) => ({
      percentBp: discount.mode === 'percent' ? discount.percentBp : null,
      amount: discount.mode === 'amount' ? discount.amount : null,
    })),
    vatCharged: vat.vatCharged,
    vatRateBp: vat.vatRateBp,
  });
  const isCorrection = (CORRECTION_DOCUMENT_TYPES as readonly DocumentType[]).includes(
    state.documentType,
  );

  async function persist(): Promise<DocumentDto | null> {
    setError(null);
    const validationError = validateComposerState(state, vat);
    if (validationError) {
      setError(validationError);
      return null;
    }
    const body = toSaveDraftRequest(state, vat);
    try {
      return documentId
        ? await updateDraft({ id: documentId, body }).unwrap()
        : await saveDraft(body).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err));
      return null;
    }
  }

  async function handleSaveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await persist();
    if (result) {
      toast({ title: 'Черновата е запазена' });
      router.push(`/documents/${result.id}`);
    }
  }

  async function handleSaveAndIssue() {
    const result = await persist();
    if (result) router.push(`/documents/${result.id}?issue=1`);
  }

  return (
    <form
      className="mx-auto flex max-w-3xl flex-col gap-6 pb-10"
      onSubmit={handleSaveDraft}
      noValidate
    >
      <h1 className="text-2xl font-bold text-text">
        {documentId ? 'Редактиране на документ' : 'Нов документ'}
      </h1>

      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ComposerDocumentTypeField
            value={state.documentType}
            onChange={(value) => setField('documentType', value)}
          />
          <ComposerClientField
            clientId={state.clientId}
            clients={clients}
            onChange={(value) => setField('clientId', value)}
          />
        </div>
        {isCorrection ? (
          <ComposerOriginalDocumentField
            value={state.originalDocumentId}
            currentDocumentId={documentId}
            hasError={!!error && !state.originalDocumentId}
            onChange={(value) => setField('originalDocumentId', value)}
          />
        ) : null}
        <ComposerDetailsFields
          documentType={state.documentType}
          referenceNumber={state.referenceNumber}
          taxEventAt={state.taxEventAt}
          dueAt={state.dueAt}
          validUntil={state.validUntil}
          onChange={patchState}
        />
      </Card>

      <ComposerLineItemsTable
        lineItems={state.lineItems}
        catalogueItems={catalogueItems}
        onAdd={controller.addLineItem}
        onChange={controller.updateLineItem}
        onRemove={controller.removeLineItem}
      />

      <ComposerDiscountsList
        discounts={state.discounts}
        onAdd={controller.addDiscount}
        onChange={controller.updateDiscount}
        onRemove={controller.removeDiscount}
      />

      {vat.isTaxDocument && issuerProfile.vatRegistered ? (
        <Card>
          <ComposerVatSection
            chargeVat={state.chargeVat}
            vatExemptionGround={state.vatExemptionGround}
            hasGroundError={!!error && vat.groundSelectable && !state.vatExemptionGround}
            onChangeChargeVat={(chargeVat) => setField('chargeVat', chargeVat)}
            onChangeGround={(ground) => setField('vatExemptionGround', ground)}
          />
        </Card>
      ) : null}

      <ComposerTotalsPanel totals={totals} vatCharged={vat.vatCharged} />

      <Card>
        <ComposerNotesFields
          notes={state.notes}
          preparedBy={state.preparedBy}
          onChange={patchState}
        />
      </Card>

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

      <ComposerActions isSubmitting={isSubmitting} onSaveAndIssue={handleSaveAndIssue} />
    </form>
  );
}
