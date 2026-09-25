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
import { ComposerCorrectionFields } from './ComposerCorrectionFields';
import { ComposerDeliveryFields } from './ComposerDeliveryFields';
import { ComposerDetailsFields } from './ComposerDetailsFields';
import { ComposerDiscountsList } from './ComposerDiscountsList';
import { ComposerDocumentTypeField } from './ComposerDocumentTypeField';
import { ComposerFrMentionsFields } from './ComposerFrMentionsFields';
import { ComposerLineItemsTable } from './ComposerLineItemsTable';
import { ComposerNotesFields } from './ComposerNotesFields';
import { ComposerTotalsPanel } from './ComposerTotalsPanel';
import { ComposerVatSection } from './ComposerVatSection';
import { isFrenchTaxDocument } from './composerFrMentionsState';
import { resolveVatTreatment } from './liveTotals';
import { useComposerState } from './useComposerState';
import { useComposerSubmit } from './useComposerSubmit';
import { useComposerTotals } from './useComposerTotals';

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
  const countryConfig = getCountryConfig(issuerProfile.country);
  const controller = useComposerState(
    existing,
    countryConfig.timeZone,
    countryConfig.defaultVatRateBp,
  );
  const { state, setField, patchState } = controller;
  const vat = resolveVatTreatment({
    documentType: state.documentType,
    vatRegistered: issuerProfile.vatRegistered,
    chargeVat: state.chargeVat,
    vatRateBp: countryConfig.defaultVatRateBp,
    groundRequired:
      countryConfig.defaultExemptionGround === null && countryConfig.exemptionGrounds.length > 0,
  });
  const { totals, vatRatePercent } = useComposerTotals(state, vat, countryConfig.defaultVatRateBp);
  const isCorrection = (CORRECTION_DOCUMENT_TYPES as readonly DocumentType[]).includes(
    state.documentType,
  );
  const isDeliveryNote = state.documentType === 'delivery_note';
  const showFrMentions = isFrenchTaxDocument(issuerProfile.country, vat.isTaxDocument);
  const { error, isSubmitting, handleSaveDraft, handleSaveAndIssue } = useComposerSubmit(
    documentId,
    state,
    vat,
    locale,
    issuerProfile.country,
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
        <ComposerCorrectionFields
          documentType={state.documentType}
          documentId={documentId}
          isCorrection={isCorrection}
          isDeliveryNote={isDeliveryNote}
          issuerCountry={issuerProfile.country}
          originalDocumentId={state.originalDocumentId}
          correctionReason={state.correctionReason}
          hasError={!!error}
          onOriginalChange={(value) => setField('originalDocumentId', value)}
          onReasonChange={(value) => setField('correctionReason', value)}
        />
        <ComposerDetailsFields
          documentType={state.documentType}
          referenceNumber={state.referenceNumber}
          taxEventAt={state.taxEventAt}
          dueAt={state.dueAt}
          validUntil={state.validUntil}
          onChange={patchState}
        />
      </Card>

      {isDeliveryNote ? (
        <Card>
          <ComposerDeliveryFields
            deliveryDate={state.deliveryDate}
            transportReason={state.transportReason}
            transportedAt={state.transportedAt}
            carrierName={state.carrierName}
            transportNote={state.transportNote}
            transportReasonOptions={countryConfig.deliveryNoteTransportReasons}
            onChange={patchState}
          />
        </Card>
      ) : null}

      {showFrMentions ? (
        <Card>
          <ComposerFrMentionsFields
            operationNature={state.operationNature}
            deliveryAddress={state.deliveryAddress}
            hasOperationNatureError={!!error && !state.operationNature}
            onChange={patchState}
          />
        </Card>
      ) : null}

      <ComposerLineItemsTable
        lineItems={state.lineItems}
        catalogueItems={catalogueItems}
        vatCharged={vat.vatCharged}
        vatRates={countryConfig.vatRates}
        defaultVatRateBp={countryConfig.defaultVatRateBp}
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
        vatRatePercent={vatRatePercent}
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
