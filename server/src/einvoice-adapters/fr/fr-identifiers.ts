function luhnValid(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const positionFromRight = digits.length - i;
    let d = Number(digits[i]);
    if (positionFromRight % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function isValidSiren(value: string): boolean {
  return /^\d{9}$/.test(value) && luhnValid(value);
}

export function isValidSiret(value: string): boolean {
  return /^\d{14}$/.test(value) && isValidSiren(value.slice(0, 9)) && luhnValid(value);
}

export function isValidFrenchVatNumber(value: string): boolean {
  return /^FR[0-9A-Z]{2}\d{9}$/.test(value);
}

export type FrenchIdentifierScheme = 'SIREN' | 'SIRET';

export interface FrenchBusinessIdentifier {
  scheme: FrenchIdentifierScheme;
  schemeId: '0002' | '0009';
  value: string;
}

export function resolveFrenchBusinessIdentifier(
  eik: string | null,
): FrenchBusinessIdentifier | null {
  if (eik === null) return null;
  if (isValidSiret(eik)) return { scheme: 'SIRET', schemeId: '0009', value: eik };
  if (isValidSiren(eik)) return { scheme: 'SIREN', schemeId: '0002', value: eik };
  return null;
}
