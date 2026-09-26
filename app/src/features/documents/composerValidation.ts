import { CORRECTION_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type { DocumentType } from '@shared/types';
import { isFrenchTaxDocument } from './composerFrMentionsState';
import { isCompleteLineItem } from './composerLineItemState';
import type { ComposerFormState, ComposerValidationErrorKey } from './composerState';
import type { VatTreatment } from './liveTotals';

export function validateComposerState(
  state: ComposerFormState,
  vat: VatTreatment,
  issuerCountry = '',
): ComposerValidationErrorKey | null {
  const isCorrection = (CORRECTION_DOCUMENT_TYPES as readonly DocumentType[]).includes(
    state.documentType,
  );
  if (isCorrection && !state.originalDocumentId) {
    return 'missingOriginalDocument';
  }
  if (state.lineItems.filter(isCompleteLineItem).length === 0) {
    return 'missingLineItems';
  }
  if (vat.groundSelectable && !state.vatExemptionGround) {
    return 'missingVatGround';
  }
  if (isFrenchTaxDocument(issuerCountry, vat.isTaxDocument) && !state.operationNature) {
    return 'missingOperationNature';
  }
  return null;
}
