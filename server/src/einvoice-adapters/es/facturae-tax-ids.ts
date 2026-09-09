export type SpanishTaxIdKind = 'NIF' | 'NIE' | 'CIF';

export interface SpanishTaxIdCheck {
  valid: boolean;
  kind: SpanishTaxIdKind | null;
  normalized: string | null;
  reason?: string;
}

const NIF_CHECK_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIE_LEADING_DIGIT: Record<string, string> = { X: '0', Y: '1', Z: '2' };
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

const CIF_NUMERIC_ONLY = new Set(['A', 'B', 'E', 'H']);
const CIF_LETTER_ONLY = new Set(['K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'W']);
const CIF_EITHER = new Set(['C', 'D', 'F', 'G', 'J', 'U', 'V']);

const NIF_PATTERN = /^(\d{8})([A-Z])$/;
const NIE_PATTERN = /^([XYZ])(\d{7})([A-Z])$/;
const CIF_PATTERN = /^([A-Z])(\d{7})([0-9A-Z])$/;

function normalize(raw: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/[\s-]/g, '');
  return trimmed.startsWith('ES') && trimmed.length > 2 ? trimmed.slice(2) : trimmed;
}

function nifCheckLetter(number: number): string {
  return NIF_CHECK_LETTERS.charAt(number % 23);
}

function checkNif(value: string): SpanishTaxIdCheck {
  const match = NIF_PATTERN.exec(value);
  if (!match) return { valid: false, kind: null, normalized: null };
  const digits = match[1] ?? '';
  const letter = match[2] ?? '';
  const expected = nifCheckLetter(Number.parseInt(digits, 10));
  if (letter !== expected) {
    return {
      valid: false,
      kind: 'NIF',
      normalized: value,
      reason: `NIF check letter should be "${expected}", got "${letter}"`,
    };
  }
  return { valid: true, kind: 'NIF', normalized: value };
}

function checkNie(value: string): SpanishTaxIdCheck {
  const match = NIE_PATTERN.exec(value);
  if (!match) return { valid: false, kind: null, normalized: null };
  const leading = match[1] ?? '';
  const digits = match[2] ?? '';
  const letter = match[3] ?? '';
  const leadingDigit = NIE_LEADING_DIGIT[leading] ?? '';
  const expected = nifCheckLetter(Number.parseInt(`${leadingDigit}${digits}`, 10));
  if (letter !== expected) {
    return {
      valid: false,
      kind: 'NIE',
      normalized: value,
      reason: `NIE check letter should be "${expected}", got "${letter}"`,
    };
  }
  return { valid: true, kind: 'NIE', normalized: value };
}

function cifControlDigit(digits: string): number {
  let doubledSum = 0;
  let plainSum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const digit = Number.parseInt(digits.charAt(i), 10);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      doubledSum += doubled >= 10 ? doubled - 9 : doubled;
    } else {
      plainSum += digit;
    }
  }
  const total = doubledSum + plainSum;
  return (10 - (total % 10)) % 10;
}

function checkCif(value: string): SpanishTaxIdCheck {
  const match = CIF_PATTERN.exec(value);
  if (!match) return { valid: false, kind: null, normalized: null };
  const orgLetter = match[1] ?? '';
  const digits = match[2] ?? '';
  const control = match[3] ?? '';
  const isCifOrgLetter =
    CIF_NUMERIC_ONLY.has(orgLetter) || CIF_LETTER_ONLY.has(orgLetter) || CIF_EITHER.has(orgLetter);
  if (!isCifOrgLetter) return { valid: false, kind: null, normalized: null };

  const controlDigit = cifControlDigit(digits);
  const controlLetter = CIF_CONTROL_LETTERS.charAt(controlDigit);
  const numericMatches = control === String(controlDigit);
  const letterMatches = control === controlLetter;

  let ok: boolean;
  if (CIF_NUMERIC_ONLY.has(orgLetter)) ok = numericMatches;
  else if (CIF_LETTER_ONLY.has(orgLetter)) ok = letterMatches;
  else ok = numericMatches || letterMatches;

  if (!ok) {
    const expected = CIF_NUMERIC_ONLY.has(orgLetter)
      ? String(controlDigit)
      : CIF_LETTER_ONLY.has(orgLetter)
        ? controlLetter
        : `${controlDigit} or ${controlLetter}`;
    return {
      valid: false,
      kind: 'CIF',
      normalized: value,
      reason: `CIF control character should be "${expected}", got "${control}"`,
    };
  }
  return { valid: true, kind: 'CIF', normalized: value };
}

export function validateSpanishTaxId(raw: string | null | undefined): SpanishTaxIdCheck {
  if (!raw || raw.trim() === '') {
    return { valid: false, kind: null, normalized: null, reason: 'empty' };
  }
  const value = normalize(raw);

  if (NIF_PATTERN.test(value)) return checkNif(value);
  if (NIE_PATTERN.test(value)) return checkNie(value);
  if (CIF_PATTERN.test(value)) return checkCif(value);

  return {
    valid: false,
    kind: null,
    normalized: null,
    reason: 'does not match the NIF, NIE or CIF shape',
  };
}
