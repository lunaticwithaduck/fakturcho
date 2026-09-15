'use client';

import { Card } from '@design/components';
import { CORRECTION_DOCUMENT_TYPES, getCountryConfig } from '@fakturcho/shared-types';
import type {
  CatalogueItemDto,
  ClientDto,
  DocumentDto,
  DocumentType,
  IssuerProfileDto,
  Locale,
} from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';
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
import { computeLiveTotals, resolveVatTreatment } from './liveTotals';
import { useComposerState } from './useComposerState';
import { useComposerSubmit } from './useComposerSubmit';

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
  const t = useTranslations('documents');
  const locale = useLocale() as Locale;
  const controller = useComposerState(existing);
  const { state, setField, patchState } = controller;

  const countryConfig = getCountryConfig(issuerProfile.country);
  const vat = resolveVatTreatment({
    documentType: state.documentType,
    vatRegistered: issuerProfile.vatRegistered,
    chargeVat: state.chargeVat,
    vatRateBp: countryConfig.defaultVatRateBp,
    groundRequired:
      countryConfig.defaultExemptionGround === null && countryConfig.exemptionGrounds.length > 0,
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
  const { error, isSubmitting, handleSaveDraft, handleSaveAndIssue } = useComposerSubmit(
    documentId,
    state,
    vat,
    locale,
  );

  return (
    <form
      className="mx-auto flex max-w-3xl flex-col gap-6 pb-10"
      onSubmit={handleSaveDraft}
      noValidate
    >
      <h1 className="text-2xl font-bold text-text">
        {documentId ? t('composer.titleEdit') : t('composer.titleNew')}
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

      {vat.isTaxDocument && (issuerProfile.vatRegistered || vat.groundSelectable) ? (
        <Card>
          <ComposerVatSection
            chargeVat={issuerProfile.vatRegistered && state.chargeVat}
            showChargeToggle={issuerProfile.vatRegistered}
            vatExemptionGround={state.vatExemptionGround}
            grounds={countryConfig.exemptionGrounds}
            ratePercent={countryConfig.defaultVatRateBp / 100}
            hasGroundError={!!error && vat.groundSelectable && !state.vatExemptionGround}
            onChangeChargeVat={(chargeVat) => setField('chargeVat', chargeVat)}
            onChangeGround={(ground) => setField('vatExemptionGround', ground)}
          />
        </Card>
      ) : null}

      <ComposerTotalsPanel
        totals={totals}
        vatCharged={vat.vatCharged}
        vatRatePercent={vat.vatCharged ? vat.vatRateBp / 100 : null}
      />

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
