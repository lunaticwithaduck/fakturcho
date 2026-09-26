import {
  isValidKsefNumber,
  isValidKsefNumberChecksum,
  isValidKsefNumberDate,
  isValidKsefNumberFormat,
  normalizeKsefNumber,
} from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

// NIP(10)-RRRRMMDD(8)-1234563218-20260905-0102030405AB, CRC-8 checksum
// computed per CIRFMF/ksef-docs (faktury/numer-ksef.md).
const VALID = '1234563218-20260905-0102030405AB-7A';

describe('normalizeKsefNumber', () => {
  it('trims and upper-cases the hex segments', () => {
    expect(normalizeKsefNumber(` ${VALID.toLowerCase()} `)).toBe(VALID);
  });
});

describe('isValidKsefNumberFormat', () => {
  it('accepts NIP(10)-date(8)-hex(12)-checksum(2)', () => {
    expect(isValidKsefNumberFormat(VALID)).toBe(true);
    expect(isValidKsefNumberFormat(VALID.toLowerCase())).toBe(true);
  });

  it('rejects the wrong number or placement of segments', () => {
    expect(isValidKsefNumberFormat('1234563218-20260905-0102030405AB-00000A-7A')).toBe(false);
    expect(isValidKsefNumberFormat('1234563218-20260905-0102030405AB')).toBe(false);
    expect(isValidKsefNumberFormat('not-a-ksef-number')).toBe(false);
  });

  it('rejects the wrong segment lengths', () => {
    expect(isValidKsefNumberFormat('123456321-20260905-0102030405AB-7A')).toBe(false);
    expect(isValidKsefNumberFormat('1234563218-2026095-0102030405AB-7A')).toBe(false);
    expect(isValidKsefNumberFormat('1234563218-20260905-0102030405A-7A')).toBe(false);
  });
});

describe('isValidKsefNumberChecksum', () => {
  it('accepts a KSeF number whose CRC-8 checksum matches', () => {
    expect(isValidKsefNumberChecksum(VALID)).toBe(true);
  });

  it('rejects a KSeF number whose checksum does not match', () => {
    expect(isValidKsefNumberChecksum('1234563218-20260905-0102030405AB-00')).toBe(false);
  });

  it('rejects a malformed KSeF number outright', () => {
    expect(isValidKsefNumberChecksum('not-a-ksef-number')).toBe(false);
  });
});

describe('isValidKsefNumber', () => {
  it('requires both a valid format and a valid checksum', () => {
    expect(isValidKsefNumber(VALID)).toBe(true);
    expect(isValidKsefNumber('1234563218-20260905-0102030405AB-00')).toBe(false);
    expect(isValidKsefNumber('not-a-ksef-number')).toBe(false);
  });
});

// VALID's date segment is 2026-09-05 (see above).
describe('isValidKsefNumberDate', () => {
  it('accepts a KSeF date on or after the issue date and not after now', () => {
    expect(isValidKsefNumberDate(VALID, new Date('2026-09-05'), new Date('2026-09-10'))).toBe(true);
  });

  it('rejects a KSeF date before the invoice issue date', () => {
    expect(isValidKsefNumberDate(VALID, new Date('2026-09-06'), new Date('2026-09-10'))).toBe(
      false,
    );
  });

  it('rejects a KSeF date in the future', () => {
    expect(isValidKsefNumberDate(VALID, new Date('2026-09-01'), new Date('2026-09-04'))).toBe(
      false,
    );
  });

  it('rejects a malformed KSeF number outright', () => {
    expect(isValidKsefNumberDate('not-a-ksef-number', new Date('2026-09-05'))).toBe(false);
  });
});
