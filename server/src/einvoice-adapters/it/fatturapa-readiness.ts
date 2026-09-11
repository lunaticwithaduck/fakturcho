import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
import { EINVOICE_MISSING_FIELD_CODES } from '../../einvoice/readiness';

const FATTURAPA_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

const COUNTRY_PREFIX_PATTERN = /^[A-Z]{2}/;

const PERSONAL_CODICE_FISCALE_PATTERN = /^[A-Z]{6}\d{2}[A-EHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/;

export interface FatturaPaReadiness {
  ready: boolean;
  missingFields: string[];
}

export interface CheckFatturaPaReadinessOptions {
  sdiRecipientCode?: string;
  pec?: string;
}

export function isValidPartitaIva(value: string): boolean {
  const digits = COUNTRY_PREFIX_PATTERN.test(value) ? value.slice(2) : value;
  if (!/^\d{11}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = digits.charCodeAt(i) - 48;
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits.charCodeAt(10) - 48;
}

export function isValidCodiceFiscale(value: string): boolean {
  const trimmed = value.trim().toUpperCase();
  if (/^\d{11}$/.test(trimmed)) return isValidPartitaIva(trimmed);
  return PERSONAL_CODICE_FISCALE_PATTERN.test(trimmed);
}

export function checkFatturaPaReadiness(
  document: DocumentDto,
  options: CheckFatturaPaReadinessOptions = {},
): FatturaPaReadiness {
  if (!FATTURAPA_DOCUMENT_TYPES.includes(document.documentType)) {
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
  if (!document.issuer.country) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCountry);
  if (!document.issuer.street) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerStreet);
  if (!document.issuer.postcode) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerPostcode);

  if (!document.issuer.vatNumber) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerPartitaIva);
  } else if (!isValidPartitaIva(document.issuer.vatNumber)) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerPartitaIvaInvalid);
  }

  if (!document.issuer.eik) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCodiceFiscale);
  } else if (!isValidCodiceFiscale(document.issuer.eik)) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCodiceFiscaleInvalid);
  }

  if (!document.recipient.companyName)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCompanyName);
  if (!document.recipient.country)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCountry);

  if (!document.recipient.vatNumber && !document.recipient.eik) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientPartitaIvaOrCodiceFiscale);
  }
  if (document.recipient.vatNumber && !isValidPartitaIva(document.recipient.vatNumber)) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientPartitaIvaInvalid);
  }
  if (document.recipient.eik && !isValidCodiceFiscale(document.recipient.eik)) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCodiceFiscaleInvalid);
  }

  if (document.lineItems.length === 0) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentLineItems);
  }

  if (!options.sdiRecipientCode && !options.pec) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientSdiCodeOrPec);
  }

  return { ready: missingFields.length === 0, missingFields };
}
