import {
  DEFAULT_EXEMPTION_GROUND,
  DEFAULT_VAT_RATE_BP,
  type DocumentType,
  TAX_DOCUMENT_TYPES,
  VAT_EXEMPTION_GROUNDS,
  type VatExemptionGround,
} from '@fakturcho/shared-types';
import { DomainError } from '../common/domain-error';

export interface VatGroundInput {
  vatRegistered: boolean;
  vatRateBp: number;
  requestedGround?: string | null;
}

function isKnownGround(value: string): value is (typeof VAT_EXEMPTION_GROUNDS)[number] {
  return (VAT_EXEMPTION_GROUNDS as readonly string[]).includes(value);
}

export function validateVatGround(input: VatGroundInput): VatExemptionGround | null {
  const requested = input.requestedGround ?? null;

  if (!input.vatRegistered) {
    if (requested !== null && requested !== DEFAULT_EXEMPTION_GROUND) {
      throw new DomainError(
        'VAT_GROUND_NOT_ALLOWED',
        'A non-VAT-registered issuer always carries чл.113, ал.9 от ЗДДС.',
      );
    }
    return DEFAULT_EXEMPTION_GROUND;
  }

  if (input.vatRateBp === DEFAULT_VAT_RATE_BP) {
    if (requested !== null) {
      throw new DomainError(
        'VAT_GROUND_NOT_ALLOWED',
        'A VAT-registered issuer at the standard rate carries no exemption ground.',
      );
    }
    return null;
  }

  if (requested === null || !isKnownGround(requested)) {
    throw new DomainError(
      'VAT_GROUND_NOT_ALLOWED',
      'A VAT-registered issuer at 0% must select a statutory exemption ground.',
    );
  }
  return requested;
}

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
