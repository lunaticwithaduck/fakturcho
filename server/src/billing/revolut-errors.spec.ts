import { describe, expect, it } from 'vitest';
import { describeRevolutFailure, RevolutApiError, toDomainError } from './revolut-errors';

describe('revolut failure mapping', () => {
  it('reports a 401 as seller misconfiguration, not a server fault', () => {
    const failure = describeRevolutFailure(new RevolutApiError(401, 'Unauthorized', 'bad key'));
    expect(failure.code).toBe('CHECKOUT_NOT_CONFIGURED');
    expect(toDomainError(failure).status).toBe(503);
  });

  it('reports a 404 (unknown plan variation) as configuration rather than a generic failure', () => {
    expect(
      describeRevolutFailure(new RevolutApiError(404, 'NotFound', 'plan variation not found')).code,
    ).toBe('CHECKOUT_NOT_CONFIGURED');
  });

  it('maps an unrecognised rejection to a gateway error', () => {
    const failure = describeRevolutFailure(new RevolutApiError(422, 'InvalidAmount', 'too low'));
    expect(failure.code).toBe('PAYMENT_PROVIDER_ERROR');
    expect(toDomainError(failure).status).toBe(502);
  });

  it('maps a transport failure to a gateway timeout', () => {
    const failure = describeRevolutFailure(new Error('fetch failed'));
    expect(failure.code).toBe('PAYMENT_PROVIDER_UNREACHABLE');
    expect(toDomainError(failure).status).toBe(504);
  });

  it('carries the provider code through to the response body', () => {
    const error = toDomainError(
      describeRevolutFailure(new RevolutApiError(404, 'NotFound', 'no such plan variation')),
    );
    expect(error.details?.provider).toEqual(['NotFound', 'no such plan variation']);
  });
});
