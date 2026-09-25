// UN/ECE Recommendation 20 codes, referenced by VAT Directive art. 226(6),
// PL art. 106e ust. 1 pkt 8, BG ЗДДС чл. 114 ал. 1 т. 8, RO art. 319 (20).
export const UNIT_CODES = [
  'C62',
  'H87',
  'HUR',
  'DAY',
  'MON',
  'KGM',
  'MTR',
  'MTK',
  'LTR',
  'KMT',
  'SET',
] as const;

export type UnitCode = (typeof UNIT_CODES)[number];

export function isUnitCode(value: string): value is UnitCode {
  return (UNIT_CODES as readonly string[]).includes(value);
}
