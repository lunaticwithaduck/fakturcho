import { describe, expect, it } from 'vitest';
import { getApiErrorCode, getApiErrorMessage } from './apiError';

describe('getApiErrorCode', () => {
  it('reads a known domain error code from a fetchBaseQuery error', () => {
    const error = { status: 422, data: { code: 'ISSUER_PROFILE_INCOMPLETE', message: 'x' } };
    expect(getApiErrorCode(error, 'bg')).toBe('ISSUER_PROFILE_INCOMPLETE');
  });

  it('returns null for an unrecognized code', () => {
    const error = { status: 500, data: { code: 'SOMETHING_ELSE' } };
    expect(getApiErrorCode(error, 'bg')).toBeNull();
  });

  it('returns null when there is no error body', () => {
    expect(getApiErrorCode({ status: 500 }, 'bg')).toBeNull();
    expect(getApiErrorCode(undefined, 'bg')).toBeNull();
  });
});

describe('getApiErrorMessage', () => {
  it('maps CLIENT_EIK_DUPLICATE to a Bulgarian message', () => {
    const error = { status: 409, data: { code: 'CLIENT_EIK_DUPLICATE' } };
    expect(getApiErrorMessage(error, 'bg')).toBe('Вече има клиент с този ЕИК.');
  });

  it('maps the 402 INSUFFICIENT_CREDITS payload to the credits message', () => {
    const error = { status: 402, data: { code: 'INSUFFICIENT_CREDITS' } };
    expect(getApiErrorMessage(error, 'bg')).toBe(
      'Нямате достатъчно кредити. Издаването на документ струва 0,10 €.',
    );
  });

  it('falls back to a generic Bulgarian message', () => {
    expect(getApiErrorMessage(new Error('network down'), 'bg')).toBe(
      'Възникна грешка. Опитайте отново.',
    );
  });

  it('maps CORRECTION_REASON_REQUIRED to a Bulgarian message', () => {
    const error = { status: 422, data: { code: 'CORRECTION_REASON_REQUIRED' } };
    expect(getApiErrorMessage(error, 'bg')).toBe(
      'Кредитното или дебитно известие от България или Ирландия изисква основание за корекцията, преди да бъде издадено.',
    );
  });

  it('maps CORRECTION_REASON_REQUIRED to an English message', () => {
    const error = { status: 422, data: { code: 'CORRECTION_REASON_REQUIRED' } };
    expect(getApiErrorMessage(error, 'en')).toBe(
      'A credit or debit note from Bulgaria or Ireland needs a reason for the correction before it can be issued.',
    );
  });

  it('maps RECIPIENT_VAT_NUMBER_REQUIRED to a German message', () => {
    const error = { status: 422, data: { code: 'RECIPIENT_VAT_NUMBER_REQUIRED' } };
    expect(getApiErrorMessage(error, 'de')).toBe(
      'Eine österreichische Rechnung über 10.000 € an ein Unternehmen benötigt die UID-Nummer des Empfängers, bevor sie ausgestellt werden kann.',
    );
  });

  it('maps CLIENT_EIK_DUPLICATE to an English message', () => {
    const error = { status: 409, data: { code: 'CLIENT_EIK_DUPLICATE' } };
    expect(getApiErrorMessage(error, 'en')).toBe('A client with this company ID already exists.');
  });

  it('maps the 402 INSUFFICIENT_CREDITS payload to the English credits message', () => {
    const error = { status: 402, data: { code: 'INSUFFICIENT_CREDITS' } };
    expect(getApiErrorMessage(error, 'en')).toBe(
      'Insufficient credit. Issuing a document costs €0.10.',
    );
  });

  it('falls back to a generic English message', () => {
    expect(getApiErrorMessage(new Error('network down'), 'en')).toBe(
      'An error occurred. Please try again.',
    );
  });
});
