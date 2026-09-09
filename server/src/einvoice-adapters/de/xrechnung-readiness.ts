import type { DocumentDto } from '@fakturcho/shared-types';
import { checkEinvoiceReadiness } from '../../einvoice/readiness';

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
    missingFields.push('buyer reference or Leitweg-ID (XRechnung requires one, per BR-DE-1)');
  }

  if (options.leitwegId && !LEITWEG_ID_PATTERN.test(options.leitwegId)) {
    missingFields.push('Leitweg-ID does not match the routing-id/sub-id/checksum format');
  }

  if (!document.issuer.phone) {
    missingFields.push(
      'issuer phone number (XRechnung requires a seller contact channel, per BR-DE-2)',
    );
  }

  if (
    document.paymentMeansCode !== null &&
    CREDIT_TRANSFER_PAYMENT_MEANS.includes(document.paymentMeansCode) &&
    !document.issuer.iban
  ) {
    missingFields.push(
      'issuer IBAN (required for the selected credit transfer payment means, per BR-DE-18)',
    );
  }

  if (!document.issuer.vatNumber && !document.issuer.eik) {
    missingFields.push('issuer VAT number or legal registration id (per BR-DE-4/BR-DE-5)');
  }

  return { ready: missingFields.length === 0, missingFields };
}
