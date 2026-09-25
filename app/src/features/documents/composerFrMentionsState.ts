import type { DocumentDto, OperationNature } from '@shared/types';

export interface ComposerFrMentionsFormState {
  operationNature: OperationNature | null;
  deliveryAddress: string;
}

export interface FrMentionsRequestFields {
  operationNature: OperationNature | null;
  deliveryAddress: string | null;
}

export function blankFrMentionsState(): ComposerFrMentionsFormState {
  return { operationNature: null, deliveryAddress: '' };
}

export function frMentionsStateFromDocument(document: DocumentDto): ComposerFrMentionsFormState {
  return {
    operationNature: document.operationNature ?? null,
    deliveryAddress: document.deliveryAddress ?? '',
  };
}

export function isFrenchTaxDocument(issuerCountry: string, isTaxDocument: boolean): boolean {
  return issuerCountry === 'FR' && isTaxDocument;
}

export function frMentionsRequestFields(
  state: ComposerFrMentionsFormState,
  applicable: boolean,
): FrMentionsRequestFields {
  if (!applicable) {
    return { operationNature: null, deliveryAddress: null };
  }
  return {
    operationNature: state.operationNature,
    deliveryAddress: state.deliveryAddress.trim() || null,
  };
}
