// ISO 3166-2:RO subdivision codes. The profile's Județ field is free text, so
// both the code ("CJ") and the name ("Cluj", "Județul Cluj") must resolve.
const RO_COUNTY_CODES: Record<string, string> = {
  alba: 'AB',
  arad: 'AR',
  arges: 'AG',
  bacau: 'BC',
  bihor: 'BH',
  'bistrita-nasaud': 'BN',
  botosani: 'BT',
  braila: 'BR',
  brasov: 'BV',
  buzau: 'BZ',
  calarasi: 'CL',
  'caras-severin': 'CS',
  cluj: 'CJ',
  constanta: 'CT',
  covasna: 'CV',
  dambovita: 'DB',
  dolj: 'DJ',
  galati: 'GL',
  giurgiu: 'GR',
  gorj: 'GJ',
  harghita: 'HR',
  hunedoara: 'HD',
  ialomita: 'IL',
  iasi: 'IS',
  ilfov: 'IF',
  maramures: 'MM',
  mehedinti: 'MH',
  mures: 'MS',
  neamt: 'NT',
  olt: 'OT',
  prahova: 'PH',
  salaj: 'SJ',
  'satu mare': 'SM',
  sibiu: 'SB',
  suceava: 'SV',
  teleorman: 'TR',
  timis: 'TM',
  tulcea: 'TL',
  valcea: 'VL',
  vaslui: 'VS',
  vrancea: 'VN',
  bucuresti: 'B',
};

const KNOWN_CODES = new Set(Object.values(RO_COUNTY_CODES));

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/^(judetul|jud\.?|municipiul|mun\.?)\s+/u, '')
    .replace(/\s*-\s*/gu, '-')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function toRoSubdivisionCode(countyRegion: string): string | null {
  const trimmed = countyRegion.trim();
  const code = trimmed.toUpperCase().replace(/^RO-/u, '');
  if (KNOWN_CODES.has(code)) return `RO-${code}`;
  const byName = RO_COUNTY_CODES[normalize(trimmed)];
  return byName ? `RO-${byName}` : null;
}
