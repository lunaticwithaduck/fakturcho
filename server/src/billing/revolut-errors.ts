import type { DomainErrorCode } from '@fakturcho/shared-types';
import { DomainError } from '../common/domain-error';

export class RevolutApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly detail: string,
  ) {
    super(`Revolut API responded ${status}: ${detail}`);
  }
}

const SELLER_CONFIGURATION_STATUSES = new Set([401, 403, 404]);

export interface RevolutFailure {
  code: DomainErrorCode;
  message: string;
  providerCode: string;
  providerDetail: string;
}

export function describeRevolutFailure(error: unknown): RevolutFailure {
  if (error instanceof RevolutApiError) {
    const code = classify(error.status);
    return {
      code,
      message: messageFor(code),
      providerCode: error.code,
      providerDetail: error.detail,
    };
  }
  return {
    code: 'PAYMENT_PROVIDER_UNREACHABLE',
    message: messageFor('PAYMENT_PROVIDER_UNREACHABLE'),
    providerCode: 'none',
    providerDetail: error instanceof Error ? error.message : String(error),
  };
}

function classify(status: number): DomainErrorCode {
  if (SELLER_CONFIGURATION_STATUSES.has(status)) return 'CHECKOUT_NOT_CONFIGURED';
  return 'PAYMENT_PROVIDER_ERROR';
}

function messageFor(code: DomainErrorCode): string {
  if (code === 'CHECKOUT_NOT_CONFIGURED') {
    return 'Checkout is not configured on the payment provider. Verify the Revolut API key and plan id.';
  }
  if (code === 'PAYMENT_PROVIDER_UNREACHABLE') {
    return 'The payment provider did not respond.';
  }
  return 'The payment provider rejected the checkout request.';
}

export function toDomainError(failure: RevolutFailure): DomainError {
  return new DomainError(failure.code, failure.message, {
    provider: [failure.providerCode, failure.providerDetail],
  });
}
