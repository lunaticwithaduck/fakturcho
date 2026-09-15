import type { DocumentDto } from '@fakturcho/shared-types';
import {
  checkEinvoiceReadiness,
  EINVOICE_MISSING_FIELD_CODES,
  type EinvoiceReadiness,
} from '../../einvoice/readiness';
import { isValidRomanianCui, isValidRomanianVatNumber } from './ro-cui';

export interface CheckCiusRoReadinessOptions {
  issuerCountyRegion?: string;
  recipientCountyRegion?: string;
}

export function checkCiusRoReadiness(
  document: DocumentDto,
  options: CheckCiusRoReadinessOptions = {},
): EinvoiceReadiness {
  const base = checkEinvoiceReadiness(document);
  const missingFields = [...base.missingFields];

  if (document.issuer.country === 'RO') {
    if (!document.issuer.eik) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCui);
    } else if (!isValidRomanianCui(document.issuer.eik)) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCuiChecksum);
    }

    if (document.issuer.vatRegistered) {
      if (!document.issuer.vatNumber) {
        missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerVatNumberRoPrefix);
      } else if (!isValidRomanianVatNumber(document.issuer.vatNumber)) {
        missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerVatNumberRoFormat);
      }
    }

    if (!options.issuerCountyRegion) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCountyRegion);
    }
  }

  if (document.recipient.country === 'RO') {
    if (!document.recipient.eik) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCui);
    } else if (!isValidRomanianCui(document.recipient.eik)) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCuiChecksum);
    }

    if (document.recipient.vatNumber && !isValidRomanianVatNumber(document.recipient.vatNumber)) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientVatNumberRoFormat);
    }

    if (!options.recipientCountyRegion) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCountyRegion);
    }
  }

  return { ready: missingFields.length === 0, missingFields };
}
