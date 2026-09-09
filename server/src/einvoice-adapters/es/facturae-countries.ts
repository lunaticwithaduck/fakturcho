const ALPHA2_TO_ALPHA3: Record<string, string> = {
  AT: 'AUT',
  BE: 'BEL',
  BG: 'BGR',
  CY: 'CYP',
  CZ: 'CZE',
  DE: 'DEU',
  DK: 'DNK',
  EE: 'EST',
  ES: 'ESP',
  FI: 'FIN',
  FR: 'FRA',
  GB: 'GBR',
  GR: 'GRC',
  HR: 'HRV',
  HU: 'HUN',
  IE: 'IRL',
  IT: 'ITA',
  LT: 'LTU',
  LU: 'LUX',
  LV: 'LVA',
  MT: 'MLT',
  NL: 'NLD',
  PL: 'POL',
  PT: 'PRT',
  RO: 'ROU',
  SE: 'SWE',
  SI: 'SVN',
  SK: 'SVK',
  US: 'USA',
};

export function toAlpha3CountryCode(alpha2: string | null): string {
  if (!alpha2) return 'ESP';
  return ALPHA2_TO_ALPHA3[alpha2.toUpperCase()] ?? alpha2.toUpperCase();
}

const EU_ALPHA2 = new Set(
  Object.keys(ALPHA2_TO_ALPHA3).filter((code) => code !== 'GB' && code !== 'US'),
);

export function residenceTypeCode(alpha2: string | null): 'R' | 'U' | 'E' {
  if (!alpha2 || alpha2.toUpperCase() === 'ES') return 'R';
  return EU_ALPHA2.has(alpha2.toUpperCase()) ? 'U' : 'E';
}

const UNIT_CODE_TO_FACTURAE: Record<string, string> = {
  HUR: '02',
  H87: '01',
  C62: '01',
  KGM: '03',
  LTR: '04',
  MTR: '13',
  KMT: '12',
  MTK: '98',
  DAY: '01',
};

export function toFacturaeUnitOfMeasure(unitCode: string | null): string {
  if (!unitCode) return '01';
  return UNIT_CODE_TO_FACTURAE[unitCode.toUpperCase()] ?? '01';
}
