import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';

const EINVOICE_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

const REFERENCE_REQUIRED_PAYMENT_MEANS: readonly string[] = ['30', '58'];

export interface EinvoiceReadiness {
  ready: boolean;
  missingFields: string[];
}

export function checkEinvoiceReadiness(document: DocumentDto): EinvoiceReadiness {
  if (!EINVOICE_DOCUMENT_TYPES.includes(document.documentType)) {
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
  if (document.issuer.vatRegistered && !document.issuer.vatNumber) {
    missingFields.push('issuer VAT number');
  }

  if (!document.recipient.companyName) missingFields.push('recipient company name');
  if (!document.recipient.country) missingFields.push('recipient country');
  if (!document.recipient.street) missingFields.push('recipient street address');
  if (!document.recipient.postcode) missingFields.push('recipient postcode');

  const hasReverseCharge = document.lineItems.some((line) => line.vatCategory === 'AE');
  if (hasReverseCharge && !document.recipient.vatNumber) {
    missingFields.push('recipient VAT number (required for intra-EU reverse charge)');
  }

  const needsExemptionGround = document.lineItems.some(
    (line) => line.vatCategory !== 'S' && line.vatCategory !== 'Z',
  );
  if (needsExemptionGround && !document.vatExemptionGround) {
    missingFields.push('VAT exemption ground (required for the selected VAT category)');
  }

  if (document.lineItems.length === 0) {
    missingFields.push('at least one line item');
  }

  for (const line of document.lineItems) {
    if (!line.unitCode) missingFields.push(`unit code on line item "${line.name}"`);
  }

  if (
    document.paymentMeansCode !== null &&
    REFERENCE_REQUIRED_PAYMENT_MEANS.includes(document.paymentMeansCode) &&
    !document.buyerReference
  ) {
    missingFields.push('buyer reference (required for the selected payment means)');
  }

  return { ready: missingFields.length === 0, missingFields };
}
