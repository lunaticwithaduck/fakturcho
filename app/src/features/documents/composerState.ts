import { CORRECTION_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type {
  DiscountInput,
  DocumentDto,
  DocumentType,
  LineItemInput,
  SaveDraftRequest,
} from '@shared/types';
import { normalizeQuantity, type VatTreatment } from './liveTotals';

export interface LineItemFormState {
  key: string;
  name: string;
  quantity: string;
  unitPrice: number | null;
}

export interface DiscountFormState {
  key: string;
  label: string;
  mode: 'percent' | 'amount';
  percentBp: number | null;
  amount: number | null;
}

export interface ComposerFormState {
  documentType: DocumentType;
  clientId: string | null;
  originalDocumentId: string | null;
  referenceNumber: string;
  taxEventAt: string;
  dueAt: string;
  validUntil: string;
  chargeVat: boolean;
  vatExemptionGround: string | null;
  notes: string;
  preparedBy: string;
  lineItems: LineItemFormState[];
  discounts: DiscountFormState[];
}

function makeKey(): string {
  return crypto.randomUUID();
}

export function createLineItem(): LineItemFormState {
  return { key: makeKey(), name: '', quantity: '1', unitPrice: null };
}

export function createDiscount(): DiscountFormState {
  return { key: makeKey(), label: '', mode: 'percent', percentBp: null, amount: null };
}

export function blankComposerState(): ComposerFormState {
  return {
    documentType: 'invoice',
    clientId: null,
    originalDocumentId: null,
    referenceNumber: '',
    taxEventAt: '',
    dueAt: '',
    validUntil: '',
    chargeVat: true,
    vatExemptionGround: null,
    notes: '',
    preparedBy: '',
    lineItems: [createLineItem()],
    discounts: [],
  };
}

export function composerStateFromDocument(document: DocumentDto): ComposerFormState {
  return {
    documentType: document.documentType,
    clientId: document.clientId,
    originalDocumentId: document.originalDocumentId,
    referenceNumber: document.referenceNumber ?? '',
    taxEventAt: document.taxEventAt ?? '',
    dueAt: document.dueAt ?? '',
    validUntil: document.validUntil ?? '',
    chargeVat: document.vatExemptionGround === null,
    vatExemptionGround: document.vatExemptionGround,
    notes: document.notes ?? '',
    preparedBy: document.preparedBy ?? '',
    lineItems:
      document.lineItems.length > 0
        ? document.lineItems.map((line) => ({
            key: line.id,
            name: line.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          }))
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

function isCompleteLineItem(line: LineItemFormState): boolean {
  return (
    line.name.trim() !== '' && normalizeQuantity(line.quantity) !== null && line.unitPrice !== null
  );
}

function isCompleteDiscount(discount: DiscountFormState): boolean {
  if (discount.label.trim() === '') return false;
  return discount.mode === 'percent' ? discount.percentBp !== null : discount.amount !== null;
}

export function toSaveDraftRequest(state: ComposerFormState, vat: VatTreatment): SaveDraftRequest {
  const lineItems: LineItemInput[] = state.lineItems
    .filter(isCompleteLineItem)
    .map((line, index) => ({
      name: line.name.trim(),
      quantity: normalizeQuantity(line.quantity) ?? '0',
      unitPrice: line.unitPrice ?? 0,
      sortOrder: index,
    }));

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

  return {
    documentType: state.documentType,
    referenceNumber: state.referenceNumber.trim() || null,
    originalDocumentId: isCorrection ? state.originalDocumentId : null,
    taxEventAt: state.taxEventAt || null,
    dueAt: state.dueAt || null,
    validUntil: state.validUntil || null,
    vatIncluded: false,
    vatExemptionGround: vat.groundSelectable ? state.vatExemptionGround : null,
    clientId: state.clientId,
    preparedBy: state.preparedBy.trim() || null,
    notes: state.notes.trim() || null,
    lineItems,
    discounts,
  };
}

export function validateComposerState(state: ComposerFormState, vat: VatTreatment): string | null {
  const isCorrection = (CORRECTION_DOCUMENT_TYPES as readonly DocumentType[]).includes(
    state.documentType,
  );
  if (isCorrection && !state.originalDocumentId) {
    return 'Изберете оригиналния документ, за да продължите.';
  }
  if (state.lineItems.filter(isCompleteLineItem).length === 0) {
    return 'Добавете поне един артикул с попълнени наименование, количество и цена.';
  }
  if (vat.groundSelectable && !state.vatExemptionGround) {
    return 'Изберете основание за неначисляване на ДДС.';
  }
  return null;
}
