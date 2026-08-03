import { describe, expect, it } from 'vitest';
import { mapAuthErrorMessage } from './authErrors';

describe('mapAuthErrorMessage', () => {
  it('translates a known error code to Bulgarian', () => {
    expect(mapAuthErrorMessage('INVALID_EMAIL_OR_PASSWORD')).toBe('Грешен имейл или парола.');
  });

  it('translates the duplicate signup code to Bulgarian', () => {
    expect(mapAuthErrorMessage('USER_ALREADY_EXISTS')).toBe(
      'Вече има регистриран потребител с този имейл.',
    );
  });

  it('falls back to a generic Bulgarian message for an unknown code', () => {
    expect(mapAuthErrorMessage('SOME_UNMAPPED_CODE')).toBe('Възникна грешка. Опитайте отново.');
  });

  it('falls back to a generic Bulgarian message when no code is given', () => {
    expect(mapAuthErrorMessage(undefined)).toBe('Възникна грешка. Опитайте отново.');
    expect(mapAuthErrorMessage(null)).toBe('Възникна грешка. Опитайте отново.');
  });
});
