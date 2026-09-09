import { describe, expect, it } from 'vitest';
import { MAX_TRANSMISSION_RETRIES, shouldRetry } from './peppol-retry-policy';

describe('shouldRetry', () => {
  it('retries a REJECTED transmission below the retry bound', () => {
    expect(shouldRetry({ status: 'REJECTED', retryCount: 0 })).toBe(true);
    expect(shouldRetry({ status: 'REJECTED', retryCount: MAX_TRANSMISSION_RETRIES - 1 })).toBe(
      true,
    );
  });

  it('stops retrying a REJECTED transmission once the bound is reached', () => {
    expect(shouldRetry({ status: 'REJECTED', retryCount: MAX_TRANSMISSION_RETRIES })).toBe(false);
    expect(shouldRetry({ status: 'REJECTED', retryCount: MAX_TRANSMISSION_RETRIES + 1 })).toBe(
      false,
    );
  });

  it('never retries SENT, DELIVERED or QUEUED transmissions', () => {
    expect(shouldRetry({ status: 'SENT', retryCount: 0 })).toBe(false);
    expect(shouldRetry({ status: 'DELIVERED', retryCount: 0 })).toBe(false);
    expect(shouldRetry({ status: 'QUEUED', retryCount: 0 })).toBe(false);
  });
});
