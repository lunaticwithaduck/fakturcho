import type { DocumentDto } from '@fakturcho/shared-types';
import { checkEinvoiceReadiness, type EinvoiceReadiness } from '../../einvoice/readiness';
import { isValidFrenchVatNumber, resolveFrenchBusinessIdentifier } from './fr-identifiers';

export function checkFrenchEinvoiceReadiness(document: DocumentDto): EinvoiceReadiness {
  const core = checkEinvoiceReadiness(document);
  const missingFields = [...core.missingFields];

  if (document.issuer.country === 'FR') {
    if (resolveFrenchBusinessIdentifier(document.issuer.eik) === null) {
      missingFields.push('issuer SIREN or SIRET (French national business identifier)');
    }
    if (document.issuer.vatNumber !== null && !isValidFrenchVatNumber(document.issuer.vatNumber)) {
      missingFields.push('issuer VAT number in the French format ("FR" + 11 characters)');
    }
  }

  if (document.recipient.country === 'FR') {
    if (resolveFrenchBusinessIdentifier(document.recipient.eik) === null) {
      missingFields.push('recipient SIREN or SIRET (French national business identifier)');
    }
    if (
      document.recipient.vatNumber !== null &&
      !isValidFrenchVatNumber(document.recipient.vatNumber)
    ) {
      missingFields.push('recipient VAT number in the French format ("FR" + 11 characters)');
    }
  }

  return { ready: missingFields.length === 0, missingFields };
}
