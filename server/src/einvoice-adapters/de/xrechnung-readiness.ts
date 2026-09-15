import type { DocumentDto } from '@fakturcho/shared-types';
import { checkEinvoiceReadiness, EINVOICE_MISSING_FIELD_CODES } from '../../einvoice/readiness';

const CREDIT_TRANSFER_PAYMENT_MEANS: readonly string[] = ['30', '58'];

const LEITWEG_ID_PATTERN = /^\d{2,12}-\d{1,30}-\d{2}$/;

export interface XRechnungReadiness {
  ready: boolean;
  missingFields: string[];
}

export interface CheckXRechnungReadinessOptions {
  leitwegId?: string;
}

export function checkXRechnungReadiness(
  document: DocumentDto,
  options: CheckXRechnungReadinessOptions = {},
): XRechnungReadiness {
  const effectiveBuyerReference = options.leitwegId ?? document.buyerReference;
  const effectiveDocument: DocumentDto = options.leitwegId
    ? { ...document, buyerReference: options.leitwegId }
    : document;

  const core = checkEinvoiceReadiness(effectiveDocument);
  const missingFields = [...core.missingFields];

  if (!effectiveBuyerReference) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentBuyerReferenceOrLeitwegId);
  }

  if (options.leitwegId && !LEITWEG_ID_PATTERN.test(options.leitwegId)) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentLeitwegIdFormat);
  }

  if (!document.issuer.phone) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerPhone);
  }

  if (
    document.paymentMeansCode !== null &&
    CREDIT_TRANSFER_PAYMENT_MEANS.includes(document.paymentMeansCode) &&
    !document.issuer.iban
  ) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerIban);
  }

  if (!document.issuer.vatNumber && !document.issuer.eik) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerVatNumberOrRegistrationId);
  }

  return { ready: missingFields.length === 0, missingFields };
}
