import type { DocumentDto } from '@fakturcho/shared-types';
import {
  checkEinvoiceReadiness,
  EINVOICE_MISSING_FIELD_CODES,
  type EinvoiceReadiness,
} from '../../einvoice/readiness';
import { isValidFrenchVatNumber, resolveFrenchBusinessIdentifier } from './fr-identifiers';

export function checkFrenchEinvoiceReadiness(document: DocumentDto): EinvoiceReadiness {
  const core = checkEinvoiceReadiness(document);
  const missingFields = [...core.missingFields];

  if (document.issuer.country === 'FR') {
    if (resolveFrenchBusinessIdentifier(document.issuer.eik) === null) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerSirenOrSiret);
    }
    if (document.issuer.vatNumber !== null && !isValidFrenchVatNumber(document.issuer.vatNumber)) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerVatNumberFrFormat);
    }
  }

  if (document.recipient.country === 'FR') {
    if (resolveFrenchBusinessIdentifier(document.recipient.eik) === null) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientSirenOrSiret);
    }
    if (
      document.recipient.vatNumber !== null &&
      !isValidFrenchVatNumber(document.recipient.vatNumber)
    ) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientVatNumberFrFormat);
    }
  }

  return { ready: missingFields.length === 0, missingFields };
}
