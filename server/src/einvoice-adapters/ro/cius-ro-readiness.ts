import type { DocumentDto } from '@fakturcho/shared-types';
import { checkEinvoiceReadiness, type EinvoiceReadiness } from '../../einvoice/readiness';
import { isValidRomanianCui, isValidRomanianVatNumber } from './ro-cui';

export function checkCiusRoReadiness(document: DocumentDto): EinvoiceReadiness {
  const base = checkEinvoiceReadiness(document);
  const missingFields = [...base.missingFields];

  if (document.issuer.country === 'RO') {
    if (!document.issuer.eik) {
      missingFields.push('issuer CUI (Romanian tax registration code, required by CIUS-RO)');
    } else if (!isValidRomanianCui(document.issuer.eik)) {
      missingFields.push('issuer CUI fails the Romanian checksum (CIUS-RO)');
    }

    if (document.issuer.vatRegistered) {
      if (!document.issuer.vatNumber) {
        missingFields.push('issuer RO VAT number (CIUS-RO requires the RO prefix)');
      } else if (!isValidRomanianVatNumber(document.issuer.vatNumber)) {
        missingFields.push('issuer VAT number is not a valid RO-prefixed CUI (CIUS-RO)');
      }
    }
  }

  if (document.recipient.country === 'RO') {
    if (!document.recipient.eik) {
      missingFields.push('recipient CUI (Romanian tax registration code, required by CIUS-RO)');
    } else if (!isValidRomanianCui(document.recipient.eik)) {
      missingFields.push('recipient CUI fails the Romanian checksum (CIUS-RO)');
    }

    if (document.recipient.vatNumber && !isValidRomanianVatNumber(document.recipient.vatNumber)) {
      missingFields.push('recipient VAT number is not a valid RO-prefixed CUI (CIUS-RO)');
    }
  }

  return { ready: missingFields.length === 0, missingFields };
}
