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

export function cityWithCountyRegion(
  city: string | null | undefined,
  countyRegion: string | null | undefined,
  country: string | null | undefined,
): string | null | undefined {
  if (country === 'IT' && city && countyRegion) return `${city} (${countyRegion})`;
  return city;
}

export function appendCountyRegionSuffix(
  address: string,
  city: string | null | undefined,
  countyRegion: string | null | undefined,
  country: string | null | undefined,
): string {
  if (!address || !countyRegion) return address;
  if (country === 'RO') return `${address}, jud. ${countyRegion}`;
  if (country === 'ES' && (!city || city.toLowerCase() !== countyRegion.toLowerCase())) {
    return `${address}, ${countyRegion}`;
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
