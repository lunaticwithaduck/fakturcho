import { describe, expect, it } from 'vitest';
import { mapAuthErrorMessage } from './authErrors';

describe('mapAuthErrorMessage', () => {
  it('returns a known error code as its own message key', () => {
    expect(mapAuthErrorMessage('INVALID_EMAIL_OR_PASSWORD')).toBe('INVALID_EMAIL_OR_PASSWORD');
  });

  it('returns the duplicate signup code as its own message key', () => {
    expect(mapAuthErrorMessage('USER_ALREADY_EXISTS')).toBe('USER_ALREADY_EXISTS');
  });

  it('falls back to the generic message key for an unknown code', () => {
    expect(mapAuthErrorMessage('SOME_UNMAPPED_CODE')).toBe('generic');
  });

  it('falls back to the generic message key when no code is given', () => {
    expect(mapAuthErrorMessage(undefined)).toBe('generic');
    expect(mapAuthErrorMessage(null)).toBe('generic');
  });
});
