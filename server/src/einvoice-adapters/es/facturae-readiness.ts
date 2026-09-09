import type {
  DocumentDto,
  DocumentType,
  IssuerSnapshotDto,
  RecipientSnapshotDto,
} from '@fakturcho/shared-types';
import { validateSpanishTaxId } from './facturae-tax-ids';

const FACTURAE_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

export interface FacturaeReadiness {
  ready: boolean;
  missingFields: string[];
}

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
    country: string | null;
    eik: string | null;
    vatNumber: string | null;
  },
  missingFields: string[],
): void {
  if (!party.companyName) missingFields.push(`${role} company name`);
  if (!party.street) missingFields.push(`${role} street address`);
  if (!party.postcode) missingFields.push(`${role} postcode`);
  if (!party.country) missingFields.push(`${role} country`);

  const taxId = partyTaxId(party);
  if (!taxId) {
    missingFields.push(`${role} NIF/CIF/NIE tax identifier`);
    return;
  }
  const result = validateSpanishTaxId(taxId);
  if (!result.valid) {
    missingFields.push(
      `${role} tax identifier "${taxId}" is not a valid Spanish NIF, NIE or CIF${
        result.reason ? ` (${result.reason})` : ''
      }`,
    );
  }
}

export function checkFacturaeReadiness(document: DocumentDto): FacturaeReadiness {
  if (!FACTURAE_DOCUMENT_TYPES.includes(document.documentType)) {
    return {
      ready: false,
      missingFields: ['document type must be an invoice, credit note or debit note'],
    };
  }

  const missingFields: string[] = [];

  if (document.number === null) missingFields.push('document number (document must be issued)');
  if (document.issuedAt === null) missingFields.push('issue date');

  checkParty('issuer', document.issuer, missingFields);
  checkParty('recipient', document.recipient, missingFields);

  if (document.lineItems.length === 0) {
    missingFields.push('at least one line item');
  }

  return { ready: missingFields.length === 0, missingFields };
}
