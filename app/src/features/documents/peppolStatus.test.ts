import type { EinvoiceTransmissionStatus } from '@app/api';
import { describe, expect, it } from 'vitest';
import { getPeppolStatusBadgeVariant, getPeppolStatusMessageKey } from './peppolStatus';

describe('getPeppolStatusBadgeVariant', () => {
  const cases: Array<[EinvoiceTransmissionStatus, string]> = [
    ['QUEUED', 'neutral'],
    ['SENT', 'success'],
    ['DELIVERED', 'success'],
    ['REJECTED', 'danger'],
  ];

  it.each(cases)('maps %s to the %s badge variant', (status, expected) => {
    expect(getPeppolStatusBadgeVariant(status)).toBe(expected);
  });
});

describe('getPeppolStatusMessageKey', () => {
  const cases: Array<[EinvoiceTransmissionStatus, string]> = [
    ['QUEUED', 'statusQueued'],
    ['SENT', 'statusSent'],
    ['DELIVERED', 'statusDelivered'],
    ['REJECTED', 'statusRejected'],
  ];

  it.each(cases)('maps %s to the %s message key', (status, expected) => {
    expect(getPeppolStatusMessageKey(status)).toBe(expected);
  });
});
