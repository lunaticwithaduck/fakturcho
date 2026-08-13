export const DOMAIN_ERROR_CODES = [
  'NUMBER_COLLISION',
  'SERIES_OVERRIDE_LOCKED',
  'DOCUMENT_IMMUTABLE',
  'DOCUMENT_NOT_ISSUED',
  'ORIGINAL_DOCUMENT_REQUIRED',
  'ISSUER_PROFILE_INCOMPLETE',
  'VAT_GROUND_NOT_ALLOWED',
  'CLIENT_EIK_DUPLICATE',
  'SUBSCRIPTION_REQUIRED',
  'INSUFFICIENT_CREDITS',
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'UNAUTHORIZED',
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export interface ApiErrorDto {
  code: DomainErrorCode;
  message: string;
  details?: Record<string, string[]>;
}
