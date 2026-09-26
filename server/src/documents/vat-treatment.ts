import type { CountryConfig, DocumentType, VatCategory } from '@fakturcho/shared-types';
import { getCountryConfig, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { DomainError } from '../common/domain-error';

function assertKnownGround(country: CountryConfig, ground: string): void {
  if (country.exemptionGrounds.length === 0) return;
  if ((country.exemptionGrounds as readonly string[]).includes(ground)) return;
  throw new DomainError(
    'VAT_GROUND_NOT_ALLOWED',
    `"${ground}" is not a statutory VAT exemption ground for ${country.country}.`,
  );
}

export interface VatTreatmentInput {
  documentType: DocumentType;
  vatRegistered: boolean;
  requestedGround: string | null;
  issuerCountry: string;
  // AT only (§ 10 Abs. 4 UStG 1994 Jungholz/Mittelberg): swaps the standard
  // rate 20% -> 19% for this issuer. Every other country ignores it.
  issuerIdentifiers?: Record<string, string> | null;
}

export interface VatTreatment {
  vatCharged: boolean;
  vatRateBp: number;
  vatExemptionGround: string | null;
}

// A proforma or quote creates no tax obligation, but a VAT-registered issuer
// still owes the client a figure that matches the invoice to come (SPEC §5
// forbids only the exemption line and the "(Original)" marker on these two
// types, not the VAT amount itself). A non-registered issuer never charges
// VAT here either, same as before, and with no ground to select — the
// exemption ground is a tax-document concept.
const VAT_ESTIMATE_DOCUMENT_TYPES: readonly DocumentType[] = ['proforma', 'quote'];

export function resolveVatTreatment(input: VatTreatmentInput): VatTreatment {
  const country = getCountryConfig(input.issuerCountry, input.issuerIdentifiers);
  const isTaxDocument = TAX_DOCUMENT_TYPES[input.documentType];
  const isVatEstimate = VAT_ESTIMATE_DOCUMENT_TYPES.includes(input.documentType);
  if (!isTaxDocument && !isVatEstimate) {
    return { vatCharged: false, vatRateBp: 0, vatExemptionGround: null };
  }
  if (!input.vatRegistered) {
    if (!isTaxDocument) {
      return { vatCharged: false, vatRateBp: 0, vatExemptionGround: null };
    }
    const vatExemptionGround = country.defaultExemptionGround ?? input.requestedGround;
    if (!vatExemptionGround && country.exemptionGrounds.length > 0) {
      throw new DomainError(
        'VAT_GROUND_NOT_ALLOWED',
        `${country.country} has no default VAT exemption ground; a non-VAT-registered issuer must select one.`,
      );
    }
    if (vatExemptionGround && vatExemptionGround === input.requestedGround) {
      assertKnownGround(country, vatExemptionGround);
    }
    return { vatCharged: false, vatRateBp: 0, vatExemptionGround };
  }
  if (input.requestedGround) {
    assertKnownGround(country, input.requestedGround);
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
