import type { DocumentType } from '@fakturcho/shared-types';
import {
  DEFAULT_EXEMPTION_GROUND,
  DEFAULT_VAT_RATE_BP,
  TAX_DOCUMENT_TYPES,
} from '@fakturcho/shared-types';

export interface VatTreatmentInput {
  documentType: DocumentType;
  vatRegistered: boolean;
  requestedGround: string | null;
}

export interface VatTreatment {
  vatCharged: boolean;
  vatRateBp: number;
  vatExemptionGround: string | null;
}

export function resolveVatTreatment(input: VatTreatmentInput): VatTreatment {
  if (!TAX_DOCUMENT_TYPES[input.documentType]) {
    return { vatCharged: false, vatRateBp: 0, vatExemptionGround: null };
  }
  if (!input.vatRegistered) {
    return { vatCharged: false, vatRateBp: 0, vatExemptionGround: DEFAULT_EXEMPTION_GROUND };
  }
  if (input.requestedGround) {
    return { vatCharged: false, vatRateBp: 0, vatExemptionGround: input.requestedGround };
  }
  return { vatCharged: true, vatRateBp: DEFAULT_VAT_RATE_BP, vatExemptionGround: null };
}
