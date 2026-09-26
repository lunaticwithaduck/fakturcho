import { todayIsoDate } from '@app/features/shared/format';
import { CORRECTION_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type { DiscountInput, DocumentDto, DocumentType, SaveDraftRequest } from '@shared/types';
import {
  blankDeliveryState,
  type ComposerDeliveryFormState,
  deliveryRequestFields,
  deliveryStateFromDocument,
} from './composerDeliveryState';
import {
  blankFrMentionsState,
  type ComposerFrMentionsFormState,
  frMentionsRequestFields,
  frMentionsStateFromDocument,
  isFrenchTaxDocument,
} from './composerFrMentionsState';
import {
  buildLineItemInputs,
  createLineItem,
  type LineItemFormState,
  lineItemFormStateFromDto,
} from './composerLineItemState';
import { addDaysToIsoDate } from './composerPaymentTermsState';
import type { VatTreatment } from './liveTotals';

export type { LineItemFormState } from './composerLineItemState';
export { createLineItem } from './composerLineItemState';

export interface DiscountFormState {
  key: string;
  label: string;
  mode: 'percent' | 'amount';
  percentBp: number | null;
  amount: number | null;
}

export interface ComposerFormState extends ComposerDeliveryFormState, ComposerFrMentionsFormState {
  documentType: DocumentType;
  clientId: string | null;
  originalDocumentId: string | null;
  correctionReason: string;
  referenceNumber: string;
  taxEventAt: string;
  dueAt: string;
  paymentTermsDays: number | null;
  validUntil: string;
  chargeVat: boolean;
  vatExemptionGround: string | null;
  notes: string;
  preparedBy: string;
  lineItems: LineItemFormState[];
  discounts: DiscountFormState[];
}

export type ComposerValidationErrorKey =
  | 'missingOriginalDocument'
  | 'missingLineItems'
  | 'missingVatGround'
  | 'missingOperationNature';

function makeKey(): string {
  return crypto.randomUUID();
}

export function createDiscount(): DiscountFormState {
  return { key: makeKey(), label: '', mode: 'percent', percentBp: null, amount: null };
}

export function blankComposerState(
  defaultPaymentTermsDays: number | null = null,
): ComposerFormState {
  return {
    documentType: 'invoice',
    clientId: null,
    originalDocumentId: null,
    correctionReason: '',
    referenceNumber: '',
    taxEventAt: '',
    dueAt:
      defaultPaymentTermsDays !== null
        ? addDaysToIsoDate(todayIsoDate(), defaultPaymentTermsDays)
        : '',
    paymentTermsDays: defaultPaymentTermsDays,
    validUntil: '',
    ...blankDeliveryState(),
    ...blankFrMentionsState(),
    chargeVat: true,
    vatExemptionGround: null,
    notes: '',
    preparedBy: '',
    lineItems: [createLineItem()],
    discounts: [],
  };
}

export function composerStateFromDocument(
  document: DocumentDto,
  timeZone: string,
  defaultVatRateBp: number,
): ComposerFormState {
  return {
    documentType: document.documentType,
    clientId: document.clientId,
    originalDocumentId: document.originalDocumentId,
    correctionReason: document.correctionReason ?? '',
    referenceNumber: document.referenceNumber ?? '',
    taxEventAt: document.taxEventAt ?? '',
    dueAt: document.dueAt ?? '',
    paymentTermsDays: document.paymentTermsDays ?? null,
    validUntil: document.validUntil ?? '',
    ...deliveryStateFromDocument(document, timeZone),
    ...frMentionsStateFromDocument(document),
    chargeVat: document.vatExemptionGround === null,
    vatExemptionGround: document.vatExemptionGround,
    notes: document.notes ?? '',
    preparedBy: document.preparedBy ?? '',
    lineItems:
      document.lineItems.length > 0
        ? document.lineItems.map((line) => lineItemFormStateFromDto(line, defaultVatRateBp))
        : [createLineItem()],
    discounts: document.discounts.map((discount) => ({
      key: discount.id,
      label: discount.label,
      mode: discount.percentBp != null ? 'percent' : 'amount',
      percentBp: discount.percentBp,
      amount: discount.amount,
    })),
  };
}

function isCompleteDiscount(discount: DiscountFormState): boolean {
  if (discount.label.trim() === '') return false;
  return discount.mode === 'percent' ? discount.percentBp !== null : discount.amount !== null;
}

export function toSaveDraftRequest(
  state: ComposerFormState,
  vat: VatTreatment,
  issuerCountry = '',
): SaveDraftRequest {
  const lineItems = buildLineItemInputs(state.lineItems);

  const discounts: DiscountInput[] = state.discounts
    .filter(isCompleteDiscount)
    .map((discount, index) => ({
      label: discount.label.trim(),
      percentBp: discount.mode === 'percent' ? discount.percentBp : null,
      amount: discount.mode === 'amount' ? discount.amount : null,
      sortOrder: index,
    }));

  const isCorrection = (CORRECTION_DOCUMENT_TYPES as readonly DocumentType[]).includes(
    state.documentType,
  );
  const isDeliveryNote = state.documentType === 'delivery_note';

  return {
    documentType: state.documentType,
    referenceNumber: state.referenceNumber.trim() || null,
    originalDocumentId: isCorrection || isDeliveryNote ? state.originalDocumentId : null,
    correctionReason: isCorrection ? state.correctionReason.trim() || null : null,
    taxEventAt: state.taxEventAt || null,
    dueAt: state.dueAt || null,
    paymentTermsDays: state.paymentTermsDays,
    validUntil: state.validUntil || null,
    ...deliveryRequestFields(state, isDeliveryNote),
    ...frMentionsRequestFields(state, isFrenchTaxDocument(issuerCountry, vat.isTaxDocument)),
    vatIncluded: false,
    vatExemptionGround: vat.groundSelectable ? state.vatExemptionGround : null,
    clientId: state.clientId,
    preparedBy: state.preparedBy.trim() || null,
    notes: state.notes.trim() || null,
    lineItems,
    discounts,
  };
}
