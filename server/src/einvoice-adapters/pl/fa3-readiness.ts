import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
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
      missingFields: ['document type must be an invoice, credit note or debit note'],
    };
  }

  const missingFields: string[] = [];

  if (document.number === null) missingFields.push('document number (document must be issued)');
  if (document.issuedAt === null) missingFields.push('issue date');

  if (!document.issuer.companyName) missingFields.push('issuer company name');
  if (!document.issuer.street) missingFields.push('issuer street address');
  if (!document.issuer.postcode) missingFields.push('issuer postcode');

  if (!document.issuer.vatNumber) {
    missingFields.push('issuer NIP (required for KSeF submission)');
  } else if (!isValidNip(document.issuer.vatNumber)) {
    missingFields.push('issuer NIP fails the checksum validation');
  }

  if (!document.recipient.companyName) missingFields.push('recipient company name');
  if (!document.recipient.country) missingFields.push('recipient country');

  const isDomesticBuyer = document.recipient.country === 'PL';
  if (isDomesticBuyer) {
    if (!document.recipient.vatNumber) {
      missingFields.push('recipient NIP (required for a domestic Polish buyer)');
    } else if (!isValidNip(document.recipient.vatNumber)) {
      missingFields.push('recipient NIP fails the checksum validation');
    }
  }

  const hasReverseCharge = document.lineItems.some((line) => line.vatCategory === 'AE');
  if (hasReverseCharge && !isDomesticBuyer && !document.recipient.vatNumber) {
    missingFields.push('recipient VAT number (required for intra-EU reverse charge)');
  }

  if (document.lineItems.length === 0) {
    missingFields.push('at least one line item');
  }

  return { ready: missingFields.length === 0, missingFields };
}
