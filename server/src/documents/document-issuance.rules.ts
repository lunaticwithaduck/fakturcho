import {
  CORRECTION_REASON_REQUIRED_COUNTRIES,
  type DocumentType,
  TAX_DOCUMENT_TYPES,
} from '@fakturcho/shared-types';
import type { Client, Document } from '@prisma/client';
import { DomainError } from '../common/domain-error';

const AT_RECIPIENT_UID_THRESHOLD_CENTS = 1_000_000;

export function assertIssuable(
  existing: Document,
  documentType: DocumentType,
  country: string | null,
  client: Pick<Client, 'vatNumber' | 'eik' | 'country' | 'clientType'> | null = null,
): void {
  if (documentType === 'delivery_note') {
    // DPR 472/1996 art. 1: an Italian DDT is not valid without its causale del
    // trasporto and the date/time transport started.
    if (country === 'IT' && (!existing.transportReason || !existing.transportedAt)) {
      throw new DomainError(
        'DELIVERY_NOTE_TRANSPORT_DATA_REQUIRED',
        'An Italian delivery note requires a transport reason and transport date/time before issuing.',
      );
    }
    // OMFP 2634/2015, model 14-3-6A: an aviz de însoțire a mărfii is not valid
    // without the carrier/delegate and the date the transport started.
    if (country === 'RO' && (!existing.carrierName || !existing.transportedAt)) {
      throw new DomainError(
        'DELIVERY_NOTE_TRANSPORT_DATA_REQUIRED',
        'A Romanian delivery note requires a carrier/delegate and transport date/time before issuing.',
      );
    }
  }

  const isCorrection = documentType === 'credit_note' || documentType === 'debit_note';
  // BG ЗДДС чл. 115, ал. 4, т. 2; IE VAT Regulations 2010 Reg. 20: these
  // issuers must state a reason before a credit or debit note can be issued.
  if (
    isCorrection &&
    country &&
    CORRECTION_REASON_REQUIRED_COUNTRIES.includes(country) &&
    !existing.correctionReason
  ) {
    throw new DomainError(
      'CORRECTION_REASON_REQUIRED',
      'A credit or debit note issued from Bulgaria or Ireland requires a reason for the correction before it can be issued.',
    );
  }

  // CGI art. 242 nonies A: a French tax document must state the nature of
  // the operation before it can be issued.
  if (country === 'FR' && TAX_DOCUMENT_TYPES[documentType] && !existing.operationNature) {
    throw new DomainError(
      'OPERATION_NATURE_REQUIRED',
      'A French tax document requires the nature of the operation before issuing.',
    );
  }

  // § 11 Abs. 1 Z 3 lit. b UStG 1994: a domestic AT invoice whose gross total
  // exceeds €10,000 must show the business recipient's UID. The client's own
  // clientType is the real signal; when it is unmeasured (null, an existing
  // client from before this field existed), fall back to "has its own
  // Firmenbuchnummer/company id (eik) on file" as the business signal.
  const atRecipientIsBusiness =
    client?.clientType === 'business' || (client?.clientType == null && Boolean(client?.eik));
  if (
    country === 'AT' &&
    documentType === 'invoice' &&
    existing.currency === 'EUR' &&
    existing.amount > AT_RECIPIENT_UID_THRESHOLD_CENTS &&
    client?.country === 'AT' &&
    atRecipientIsBusiness &&
    !client.vatNumber
  ) {
    throw new DomainError(
      'RECIPIENT_VAT_NUMBER_REQUIRED',
      'An Austrian invoice over €10,000 to a business recipient requires the recipient’s UID before it can be issued.',
    );
  }
}

export function issuedNumberPrefix(existing: Document): string | null {
  return existing.numberPrefix;
}
