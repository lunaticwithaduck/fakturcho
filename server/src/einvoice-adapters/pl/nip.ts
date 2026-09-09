const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const;

export function normalizeNip(raw: string): string {
  return raw.trim().toUpperCase().replace(/^PL/, '').replace(/[\s-]/g, '');
}

export function isValidNipFormat(raw: string): boolean {
  return /^\d{10}$/.test(normalizeNip(raw));
}

export function isValidNipChecksum(raw: string): boolean {
  const nip = normalizeNip(raw);
  if (!/^\d{10}$/.test(nip)) return false;

  const digits = nip.split('').map(Number);
  const sum = NIP_WEIGHTS.reduce((acc, weight, i) => acc + weight * (digits[i] ?? 0), 0);
  const checksum = sum % 11;

  return checksum !== 10 && checksum === digits[9];
}

export function isValidNip(raw: string): boolean {
  return isValidNipFormat(raw) && isValidNipChecksum(raw);
}
