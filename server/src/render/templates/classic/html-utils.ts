export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function line(label: string, value: string | null | undefined): string {
  if (!value) return '';
  return `<div>${escapeHtml(label)}${escapeHtml(value)}</div>`;
}

function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function namesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalizeForComparison(a) === normalizeForComparison(b);
}

export function addressContainsCity(
  address: string | null | undefined,
  city: string | null | undefined,
): boolean {
  if (!address || !city) return false;
  const normalizedAddress = normalizeForComparison(address).replace(/[\s,.;]+$/u, '');
  const normalizedCity = normalizeForComparison(city).trim();
  if (!normalizedCity || !normalizedAddress.endsWith(normalizedCity)) return false;
  const before = normalizedAddress.charAt(normalizedAddress.length - normalizedCity.length - 1);
  return before === '' || !/[\p{L}\p{N}]/u.test(before);
}

const BUCHAREST_NORMALIZED = 'bucuresti';

export function cityWithCountyRegion(
  city: string | null | undefined,
  countyRegion: string | null | undefined,
  country: string | null | undefined,
): string | null | undefined {
  if (country === 'IT' && city && countyRegion && !namesMatch(city, countyRegion)) {
    return `${city} (${countyRegion})`;
  }
  return city;
}

export function appendCountyRegionSuffix(
  address: string,
  city: string | null | undefined,
  countyRegion: string | null | undefined,
  country: string | null | undefined,
): string {
  if (!address || !countyRegion) return address;
  // Never repeat the city when the county/province/județ is the same name (IT/RO).
  if (namesMatch(city, countyRegion)) return address;
  if (country === 'RO') {
    // București is a municipality, not a județ, so it never takes "jud." (Legea
    // nr. 2/1968 art. 3); this only fires when countyRegion differs from city
    // (e.g. a sector of Bucharest), since the identical-name case returned above.
    return normalizeForComparison(countyRegion) === BUCHAREST_NORMALIZED
      ? `${address}, Municipiul ${countyRegion}`
      : `${address}, jud. ${countyRegion}`;
  }
  return address;
}

export function labelled(label: string, language: string): string {
  return language === 'fr' ? `${label} : ` : `${label}: `;
}

export function identifierLine(
  label: string,
  value: string | null | undefined,
  language: string,
): string {
  if (!value) return '';
  if (value.toUpperCase().startsWith(label.toUpperCase())) return line('', value);
  return line(labelled(label, language), value);
}

export function countryName(country: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(country) ?? country;
  } catch {
    return country;
  }
}

const BG_NON_BREAKING_ABBREVIATIONS = [
  'ж.к.',
  'бул.',
  'обл.',
  'гр.',
  'ул.',
  'ет.',
  'ап.',
  'вх.',
  'бл.',
  'с.',
  '№',
];

function buildAbbreviationPattern(abbreviations: readonly string[]): RegExp {
  const alternation = abbreviations
    .map((abbreviation) => abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}])(${alternation}) `, 'gu');
}

const NON_BREAKING_ABBREVIATION_PATTERNS: Partial<Record<string, RegExp>> = {
  bg: buildAbbreviationPattern(BG_NON_BREAKING_ABBREVIATIONS),
};

// A short abbreviation ("гр.", "ул.", "№"...) must stay glued to the word it
// qualifies, or a line break can strand it alone at the end of a line.
export function keepAbbreviationsWithNextWord(address: string, language: string): string {
  const pattern = NON_BREAKING_ABBREVIATION_PATTERNS[language];
  if (!pattern) return address;
  return address.replace(pattern, '$1 ');
}
