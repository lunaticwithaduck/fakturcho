const KNOWN_AUTH_ERROR_CODES = new Set([
  'INVALID_EMAIL_OR_PASSWORD',
  'INVALID_EMAIL',
  'USER_NOT_FOUND',
  'USER_ALREADY_EXISTS',
  'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
  'PASSWORD_TOO_SHORT',
  'PASSWORD_TOO_LONG',
  'INVALID_PASSWORD',
  'CREDENTIAL_ACCOUNT_NOT_FOUND',
]);

export function mapAuthErrorMessage(code?: string | null): string {
  return code && KNOWN_AUTH_ERROR_CODES.has(code) ? code : 'generic';
}
