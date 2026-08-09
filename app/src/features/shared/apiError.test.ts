import { describe, expect, it } from 'vitest';
import { getApiErrorCode, getApiErrorMessage } from './apiError';

describe('getApiErrorCode', () => {
  it('reads a known domain error code from a fetchBaseQuery error', () => {
    const error = { status: 422, data: { code: 'ISSUER_PROFILE_INCOMPLETE', message: 'x' } };
    expect(getApiErrorCode(error)).toBe('ISSUER_PROFILE_INCOMPLETE');
  });

  it('returns null for an unrecognized code', () => {
    const error = { status: 500, data: { code: 'SOMETHING_ELSE' } };
    expect(getApiErrorCode(error)).toBeNull();
  });

  it('returns null when there is no error body', () => {
    expect(getApiErrorCode({ status: 500 })).toBeNull();
    expect(getApiErrorCode(undefined)).toBeNull();
  });
});

describe('getApiErrorMessage', () => {
  it('maps CLIENT_EIK_DUPLICATE to a Bulgarian message', () => {
    const error = { status: 409, data: { code: 'CLIENT_EIK_DUPLICATE' } };
    expect(getApiErrorMessage(error)).toBe('Вече има клиент с този ЕИК.');
  });

  it('maps the 402 INSUFFICIENT_CREDITS payload to the credits message', () => {
    const error = { status: 402, data: { code: 'INSUFFICIENT_CREDITS' } };
    expect(getApiErrorMessage(error)).toBe(
      'Нямате достатъчно кредити. Издаването на документ струва 0,10 €.',
    );
  });

  it('falls back to a generic Bulgarian message', () => {
    expect(getApiErrorMessage(new Error('network down'))).toBe('Възникна грешка. Опитайте отново.');
  });
});
