import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';

const FATTURAPA_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

const COUNTRY_PREFIX_PATTERN = /^[A-Z]{2}/;

const PERSONAL_CODICE_FISCALE_PATTERN = /^[A-Z]{6}\d{2}[A-EHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/;

const CODICE_DESTINATARIO_MISSING =
  'Codice Destinatario (7-character SDI recipient channel code) or recipient PEC email — not yet modeled on DocumentDto/Client';

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
      missingFields: ['document type must be an invoice, credit note or debit note'],
    };
  }

  const missingFields: string[] = [];

  if (document.number === null) missingFields.push('document number (document must be issued)');
  if (document.issuedAt === null) missingFields.push('issue date');

  if (!document.issuer.companyName) missingFields.push('issuer company name');
  if (!document.issuer.country) missingFields.push('issuer country');
  if (!document.issuer.street) missingFields.push('issuer street address');
  if (!document.issuer.postcode) missingFields.push('issuer postcode');

  if (!document.issuer.vatNumber) {
    missingFields.push('issuer Partita IVA (VAT number)');
  } else if (!isValidPartitaIva(document.issuer.vatNumber)) {
    missingFields.push('issuer Partita IVA is not a valid Italian VAT number');
  }

  if (!document.issuer.eik) {
    missingFields.push('issuer Codice Fiscale');
  } else if (!isValidCodiceFiscale(document.issuer.eik)) {
    missingFields.push('issuer Codice Fiscale is not a valid format');
  }

  if (!document.recipient.companyName) missingFields.push('recipient company name');
  if (!document.recipient.country) missingFields.push('recipient country');

  if (!document.recipient.vatNumber && !document.recipient.eik) {
    missingFields.push('recipient Partita IVA or Codice Fiscale');
  }
  if (document.recipient.vatNumber && !isValidPartitaIva(document.recipient.vatNumber)) {
    missingFields.push('recipient Partita IVA is not a valid Italian VAT number');
  }
  if (document.recipient.eik && !isValidCodiceFiscale(document.recipient.eik)) {
    missingFields.push('recipient Codice Fiscale is not a valid format');
  }

  if (document.lineItems.length === 0) {
    missingFields.push('at least one line item');
  }

  if (!options.sdiRecipientCode && !options.pec) {
    missingFields.push(CODICE_DESTINATARIO_MISSING);
  }

  return { ready: missingFields.length === 0, missingFields };
}
