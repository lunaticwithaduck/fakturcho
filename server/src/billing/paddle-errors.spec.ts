import { ApiError } from '@paddle/paddle-node-sdk';
import { describe, expect, it } from 'vitest';
import { describePaddleFailure, toDomainError } from './paddle-errors';

function apiError(code: string, detail = 'detail text'): ApiError {
  return new ApiError({
    type: 'request_error',
    code,
    detail,
    documentation_url: 'https://developer.paddle.com',
  } as unknown as ConstructorParameters<typeof ApiError>[0]);
}

describe('paddle failure mapping', () => {
  it('reports a missing default payment link as seller misconfiguration, not a server fault', () => {
    const failure = describePaddleFailure(apiError('transaction_default_checkout_url_not_set'));
    expect(failure.code).toBe('CHECKOUT_NOT_CONFIGURED');
    expect(toDomainError(failure).status).toBe(503);
  });

  it('reports a bad api key as configuration rather than a generic failure', () => {
    expect(describePaddleFailure(apiError('invalid_token')).code).toBe('CHECKOUT_NOT_CONFIGURED');
  });

  it('maps an unrecognised provider rejection to a gateway error', () => {
    const failure = describePaddleFailure(apiError('transaction_immutable'));
    expect(failure.code).toBe('PAYMENT_PROVIDER_ERROR');
    expect(toDomainError(failure).status).toBe(502);
  });

  it('maps a transport failure to a gateway timeout', () => {
    const failure = describePaddleFailure(new Error('socket hang up'));
    expect(failure.code).toBe('PAYMENT_PROVIDER_UNREACHABLE');
    expect(toDomainError(failure).status).toBe(504);
  });

  it('carries the provider code through to the response body', () => {
    const error = toDomainError(
      describePaddleFailure(apiError('price_not_found', 'no such price')),
    );
    expect(error.details?.provider).toEqual(['price_not_found', 'no such price']);
  });
});
