const CUI_CHECK_KEY = [7, 5, 3, 2, 1, 7, 5, 3, 2];

export function isValidRomanianCui(rawValue: string): boolean {
  const trimmed = rawValue.trim();
  if (!/^\d{2,10}$/.test(trimmed)) return false;

  const controlDigit = Number(trimmed.slice(-1));
  const base = trimmed.slice(0, -1).padStart(9, '0');

  let sum = 0;
  for (let i = 0; i < CUI_CHECK_KEY.length; i += 1) {
    sum += Number(base.slice(i, i + 1)) * (CUI_CHECK_KEY[i] ?? 0);
  }

  const remainder = (sum * 10) % 11;
  const computedControlDigit = remainder === 10 ? 0 : remainder;
  return computedControlDigit === controlDigit;
}

export function isValidRomanianVatNumber(rawValue: string): boolean {
  const trimmed = rawValue.trim().toUpperCase();
  if (!trimmed.startsWith('RO')) return false;
  return isValidRomanianCui(trimmed.slice(2));
}

export function extractRomanianCui(rawValue: string): string {
  const trimmed = rawValue.trim().toUpperCase();
  return trimmed.startsWith('RO') ? trimmed.slice(2) : trimmed;
}
