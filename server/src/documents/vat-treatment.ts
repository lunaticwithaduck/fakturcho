import type { DocumentType, VatCategory } from '@fakturcho/shared-types';
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

export interface VatTreatmentLine {
  vatCategory: VatCategory;
  vatRateBp: number;
}

// A requested exemption ground zeroes the document above, which is right only if every
// line is actually exempt or reverse-charged. Once any line carries real VAT, the ground
// is a note on the exempt lines, not the whole document's treatment.
export function applyLineVatGroups(
  treatment: VatTreatment,
  lines: readonly VatTreatmentLine[],
): VatTreatment {
  const chargedRates = lines.filter((line) => line.vatRateBp > 0).map((line) => line.vatRateBp);
  if (chargedRates.length === 0) return treatment;
  return { ...treatment, vatCharged: true, vatRateBp: Math.max(...chargedRates) };
}
