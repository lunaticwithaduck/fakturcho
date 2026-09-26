import {
  EinvoiceTransmissionStatus,
  type EinvoiceTransmission as PrismaEinvoiceTransmission,
} from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { resolveOriginalKsefNumber } from './document.mapper';

function transmission(
  overrides: Partial<PrismaEinvoiceTransmission> = {},
): PrismaEinvoiceTransmission {
  return {
    id: 'tx-1',
    documentId: 'doc-1',
    provider: 'ksef',
    status: EinvoiceTransmissionStatus.ACCEPTED,
    providerMessageId: null,
    receipt: '{"ksefNumber":"1234567890-20260801-EF0123456789-AB"}',
    errorText: null,
    retryCount: 0,
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01'),
    ...overrides,
  };
}

// art. 106j ustawy o VAT: the corrected invoice's own KSeF number, so a
// correction's DaneFaKorygowanej (fa3-mapper.ts) always matches what the
// original invoice actually got, not a stale transmission record.
describe('resolveOriginalKsefNumber', () => {
  it('prefers the pasted ksefNumber over the transmission receipt', () => {
    const result = resolveOriginalKsefNumber({
      ksefNumber: '1234563218-20260905-0102030405AB-7A',
      einvoiceTransmission: transmission(),
    });
    expect(result).toBe('1234563218-20260905-0102030405AB-7A');
  });

  it('falls back to the transmission receipt when nothing was pasted', () => {
    const result = resolveOriginalKsefNumber({
      ksefNumber: null,
      einvoiceTransmission: transmission(),
    });
    expect(result).toBe('1234567890-20260801-EF0123456789-AB');
  });

  it('returns null when there is no pasted number and no KSeF transmission', () => {
    expect(resolveOriginalKsefNumber({ ksefNumber: null, einvoiceTransmission: null })).toBeNull();
    expect(
      resolveOriginalKsefNumber({
        ksefNumber: null,
        einvoiceTransmission: transmission({ provider: 'peppol' }),
      }),
    ).toBeNull();
  });

  it('returns null for a malformed receipt instead of throwing', () => {
    const result = resolveOriginalKsefNumber({
      ksefNumber: null,
      einvoiceTransmission: transmission({ receipt: 'not-json' }),
    });
    expect(result).toBeNull();
  });
});
