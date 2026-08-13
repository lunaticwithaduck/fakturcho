import type { DomainErrorCode } from '@fakturcho/shared-types';

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  NUMBER_COLLISION: 409,
  SERIES_OVERRIDE_LOCKED: 409,
  DOCUMENT_IMMUTABLE: 409,
  DOCUMENT_NOT_ISSUED: 409,
  ORIGINAL_DOCUMENT_REQUIRED: 422,
  ISSUER_PROFILE_INCOMPLETE: 422,
  VAT_GROUND_NOT_ALLOWED: 422,
  CLIENT_EIK_DUPLICATE: 409,
  SUBSCRIPTION_REQUIRED: 402,
  INSUFFICIENT_CREDITS: 402,
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
};

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}
