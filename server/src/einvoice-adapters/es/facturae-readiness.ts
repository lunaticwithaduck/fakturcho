import type {
  DocumentDto,
  DocumentType,
  IssuerSnapshotDto,
  RecipientSnapshotDto,
} from '@fakturcho/shared-types';
import { EINVOICE_MISSING_FIELD_CODES } from '../../einvoice/readiness';
import { validateSpanishTaxId } from './facturae-tax-ids';

const FACTURAE_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

export interface FacturaeReadiness {
  ready: boolean;
  missingFields: string[];
}

interface PartyFieldCodes {
  companyName: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
  taxId: string;
  taxIdInvalid: string;
}

const FIELD_CODES_BY_ROLE: Record<'issuer' | 'recipient', PartyFieldCodes> = {
  issuer: {
    companyName: EINVOICE_MISSING_FIELD_CODES.issuerCompanyName,
    street: EINVOICE_MISSING_FIELD_CODES.issuerStreet,
    postcode: EINVOICE_MISSING_FIELD_CODES.issuerPostcode,
    city: EINVOICE_MISSING_FIELD_CODES.issuerCity,
    country: EINVOICE_MISSING_FIELD_CODES.issuerCountry,
    taxId: EINVOICE_MISSING_FIELD_CODES.issuerEsTaxId,
    taxIdInvalid: EINVOICE_MISSING_FIELD_CODES.issuerEsTaxIdInvalid,
  },
  recipient: {
    companyName: EINVOICE_MISSING_FIELD_CODES.recipientCompanyName,
    street: EINVOICE_MISSING_FIELD_CODES.recipientStreet,
    postcode: EINVOICE_MISSING_FIELD_CODES.recipientPostcode,
    city: EINVOICE_MISSING_FIELD_CODES.recipientCity,
    country: EINVOICE_MISSING_FIELD_CODES.recipientCountry,
    taxId: EINVOICE_MISSING_FIELD_CODES.recipientEsTaxId,
    taxIdInvalid: EINVOICE_MISSING_FIELD_CODES.recipientEsTaxIdInvalid,
  },
};

function partyTaxId(
  party:
    | Pick<IssuerSnapshotDto, 'eik' | 'vatNumber'>
    | Pick<RecipientSnapshotDto, 'eik' | 'vatNumber'>,
): string | null {
  if (party.eik) return party.eik;
  if (party.vatNumber?.toUpperCase().startsWith('ES')) return party.vatNumber.slice(2);
  return party.vatNumber ?? null;
}

function checkParty(
  role: 'issuer' | 'recipient',
  party: {
    companyName: string | null;
    street: string | null;
    postcode: string | null;
    city: string | null;
    country: string | null;
    eik: string | null;
    vatNumber: string | null;
  },
  missingFields: string[],
): void {
  const codes = FIELD_CODES_BY_ROLE[role];
  if (!party.companyName) missingFields.push(codes.companyName);
  if (!party.street) missingFields.push(codes.street);
  if (!party.postcode) missingFields.push(codes.postcode);
  if (!party.city) missingFields.push(codes.city);
  if (!party.country) missingFields.push(codes.country);

  const taxId = partyTaxId(party);
  if (!taxId) {
    missingFields.push(codes.taxId);
    return;
  }
  const result = validateSpanishTaxId(taxId);
  if (!result.valid) {
    missingFields.push(codes.taxIdInvalid);
  }
}

export function checkFacturaeReadiness(document: DocumentDto): FacturaeReadiness {
  if (!FACTURAE_DOCUMENT_TYPES.includes(document.documentType)) {
    return {
      ready: false,
      missingFields: [EINVOICE_MISSING_FIELD_CODES.documentType],
    };
  }

  const missingFields: string[] = [];

  if (document.number === null) missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentNumber);
  if (document.issuedAt === null) missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentIssuedAt);

  checkParty('issuer', document.issuer, missingFields);
  checkParty('recipient', document.recipient, missingFields);

  if (document.lineItems.length === 0) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentLineItems);
  }

  return { ready: missingFields.length === 0, missingFields };
}
