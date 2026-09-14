import type { DocumentType, VatCategory } from '@fakturcho/shared-types';
import { getCountryConfig, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';

export interface VatTreatmentInput {
  documentType: DocumentType;
  vatRegistered: boolean;
  requestedGround: string | null;
  issuerCountry: string;
}

export interface VatTreatment {
  vatCharged: boolean;
  vatRateBp: number;
  vatExemptionGround: string | null;
}

export function resolveVatTreatment(input: VatTreatmentInput): VatTreatment {
  const country = getCountryConfig(input.issuerCountry);
  if (!TAX_DOCUMENT_TYPES[input.documentType]) {
    return { vatCharged: false, vatRateBp: 0, vatExemptionGround: null };
  }
  if (!input.vatRegistered) {
    return { vatCharged: false, vatRateBp: 0, vatExemptionGround: country.defaultExemptionGround };
  }
  if (input.requestedGround) {
    return { vatCharged: false, vatRateBp: 0, vatExemptionGround: input.requestedGround };
  }
  return { vatCharged: true, vatRateBp: country.defaultVatRateBp, vatExemptionGround: null };
}

export interface VatTreatmentLine {
  vatCategory: VatCategory;
  vatRateBp: number;
}

// A requested exemption ground zeroes the document above, which is right only if every
// line is actually exempt or reverse-charged. Once any line carries real VAT, the ground
// is a note on the exempt lines, not the whole document's treatment.
//
// With no requested ground, resolveVatTreatment above optimistically assumes the standard
// rate before line categories are known (e.g. automatic reverse charge to an EU client
// with a valid VAT number resolves per line, afterwards). If every line still ends up at
// 0%, that assumption was wrong and must be corrected here too, or the document prints a
// charged VAT row at the standard rate for an amount that was never actually taxed.
export function applyLineVatGroups(
  treatment: VatTreatment,
  lines: readonly VatTreatmentLine[],
): VatTreatment {
  const chargedRates = lines.filter((line) => line.vatRateBp > 0).map((line) => line.vatRateBp);
  if (chargedRates.length > 0) {
    return { ...treatment, vatCharged: true, vatRateBp: Math.max(...chargedRates) };
  }
  if (!treatment.vatCharged) return treatment;
  return { ...treatment, vatCharged: false, vatRateBp: 0 };
}
