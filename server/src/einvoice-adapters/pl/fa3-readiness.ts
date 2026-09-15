import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
import { EINVOICE_MISSING_FIELD_CODES } from '../../einvoice/readiness';
import { isValidNip } from './nip';

const FA3_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

export interface Fa3Readiness {
  ready: boolean;
  missingFields: string[];
}

export function checkFa3Readiness(document: DocumentDto): Fa3Readiness {
  if (!FA3_DOCUMENT_TYPES.includes(document.documentType)) {
    return {
      ready: false,
      missingFields: [EINVOICE_MISSING_FIELD_CODES.documentType],
    };
  }

  const missingFields: string[] = [];

  if (document.number === null) missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentNumber);
  if (document.issuedAt === null) missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentIssuedAt);

  if (!document.issuer.companyName)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCompanyName);
  if (!document.issuer.street) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerStreet);
  if (!document.issuer.postcode) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerPostcode);
  if (!document.issuer.city) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCity);

  const issuerNip = document.issuer.eik ?? document.issuer.vatNumber;
  if (!issuerNip) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerNip);
  } else if (!isValidNip(issuerNip)) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerNipChecksum);
  }

  if (!document.recipient.companyName)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCompanyName);
  if (!document.recipient.country)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCountry);

  const isDomesticBuyer = document.recipient.country === 'PL';
  if (isDomesticBuyer) {
    const recipientNip = document.recipient.eik ?? document.recipient.vatNumber;
    if (!recipientNip) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientNip);
    } else if (!isValidNip(recipientNip)) {
      missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientNipChecksum);
    }
  }

  const hasReverseCharge = document.lineItems.some((line) => line.vatCategory === 'AE');
  if (hasReverseCharge && !isDomesticBuyer && !document.recipient.vatNumber) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientVatNumberReverseCharge);
  }

  if (document.lineItems.length === 0) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentLineItems);
  }

  return { ready: missingFields.length === 0, missingFields };
}
