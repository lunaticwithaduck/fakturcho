const KSEF_NUMBER_PATTERN = /^\d{10}-\d{8}-[0-9A-Fa-f]{12}-[0-9A-Fa-f]{2}$/;

export function normalizeKsefNumber(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidKsefNumberFormat(raw: string): boolean {
  return KSEF_NUMBER_PATTERN.test(normalizeKsefNumber(raw));
}

// CRC-8 (polynomial 0x07, initial value 0x00, MSB-first, no reflection) over
// the leading 32-character NIP-date-identifier segment, per the KSeF invoice
// reference number structure documented in CIRFMF/ksef-docs
// (faktury/numer-ksef.md): NIP(10)-RRRRMMDD(8)-hex(12)-checksum(2).
function crc8(data: string): number {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x80) !== 0 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

export function isValidKsefNumberChecksum(raw: string): boolean {
  const ksefNumber = normalizeKsefNumber(raw);
  if (!isValidKsefNumberFormat(ksefNumber)) return false;
  const data = ksefNumber.slice(0, 32);
  const checksum = ksefNumber.slice(33, 35);
  return crc8(data).toString(16).toUpperCase().padStart(2, '0') === checksum;
}

export function isValidKsefNumber(raw: string): boolean {
  return isValidKsefNumberFormat(raw) && isValidKsefNumberChecksum(raw);
}

// The RRRRMMDD segment is the date KSeF assigned the number (on submission),
// which can only be on or after the invoice's own issue date, and never in
// the future relative to now — real KSeF cannot produce either case.
export function ksefNumberDateSegment(raw: string): string | null {
  const normalized = normalizeKsefNumber(raw);
  if (!isValidKsefNumberFormat(normalized)) return null;
  return normalized.slice(11, 19);
}

function utcDateOnly(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isValidKsefNumberDate(
  raw: string,
  issuedAt: Date,
  now: Date = new Date(),
): boolean {
  const segment = ksefNumberDateSegment(raw);
  if (segment === null) return false;
  const year = Number(segment.slice(0, 4));
  const month = Number(segment.slice(4, 6));
  const day = Number(segment.slice(6, 8));
  const ksefDate = Date.UTC(year, month - 1, day);
  return ksefDate >= utcDateOnly(issuedAt) && ksefDate <= utcDateOnly(now);
}
