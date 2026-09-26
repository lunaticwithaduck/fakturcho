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
import { ComposerDeliverySection } from './ComposerDeliverySection';
import { ComposerDiscountsList } from './ComposerDiscountsList';
import { ComposerFrMentionsFields } from './ComposerFrMentionsFields';
import { ComposerHeaderCard } from './ComposerHeaderCard';
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
    issuerProfile.defaultPaymentTermsDays,
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

      <ComposerHeaderCard
        documentId={documentId}
        clients={clients}
        issuerCountry={issuerProfile.country}
        {...(countryConfig.maxPaymentTermsDays !== undefined
          ? { maxPaymentTermsDays: countryConfig.maxPaymentTermsDays }
          : {})}
        isCorrection={isCorrection}
        isDeliveryNote={isDeliveryNote}
        hasError={!!error}
        state={state}
        setField={setField}
        patchState={patchState}
      />

      <ComposerDeliverySection
        documentType={state.documentType}
        state={state}
        issuerCountry={issuerProfile.country}
        transportReasonOptions={countryConfig.deliveryNoteTransportReasons}
        onChange={patchState}
      />

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
