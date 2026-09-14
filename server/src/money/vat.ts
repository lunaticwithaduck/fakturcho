import { type DocumentType, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';

export interface VatPresentationInput {
  vatRegistered: boolean;
  vatRateBp: number;
  vatExemptionGround: string | null;
  documentType: DocumentType;
}

export interface VatPresentation {
  vatCharged: boolean;
  showExemptionLine: boolean;
  exemptionGround: string | null;
}

export function resolveVatPresentation(input: VatPresentationInput): VatPresentation {
  const vatCharged = input.vatRegistered && input.vatRateBp > 0;
  const showExemptionLine = !vatCharged && TAX_DOCUMENT_TYPES[input.documentType];
  return {
    vatCharged,
    showExemptionLine,
    exemptionGround: showExemptionLine ? input.vatExemptionGround : null,
  };
}
