import type { DomainErrorCode } from '@fakturcho/shared-types';
import { ApiError } from '@paddle/paddle-node-sdk';
import { DomainError } from '../common/domain-error';

const SELLER_CONFIGURATION_CODES = new Set([
  'transaction_default_checkout_url_not_set',
  'transaction_checkout_not_enabled',
  'price_not_found',
  'entity_not_found',
]);

const AUTHENTICATION_CODES = new Set([
  'authentication_missing',
  'authentication_malformed',
  'invalid_token',
  'forbidden',
  'not_found',
]);

export interface PaddleFailure {
  code: DomainErrorCode;
  message: string;
  providerCode: string;
  providerDetail: string;
}

export function describePaddleFailure(error: unknown): PaddleFailure {
  if (error instanceof ApiError) {
    return {
      code: classify(error.code),
      message: messageFor(classify(error.code)),
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

function classify(providerCode: string): DomainErrorCode {
  if (SELLER_CONFIGURATION_CODES.has(providerCode)) return 'CHECKOUT_NOT_CONFIGURED';
  if (AUTHENTICATION_CODES.has(providerCode)) return 'CHECKOUT_NOT_CONFIGURED';
  return 'PAYMENT_PROVIDER_ERROR';
}

function messageFor(code: DomainErrorCode): string {
  if (code === 'CHECKOUT_NOT_CONFIGURED') {
    return 'Checkout is not configured on the payment provider. Set the default payment link and verify the price ids.';
  }
  if (code === 'PAYMENT_PROVIDER_UNREACHABLE') {
    return 'The payment provider did not respond.';
  }
  return 'The payment provider rejected the checkout request.';
}

export function toDomainError(failure: PaddleFailure): DomainError {
  return new DomainError(failure.code, failure.message, {
    provider: [failure.providerCode, failure.providerDetail],
  });
}
