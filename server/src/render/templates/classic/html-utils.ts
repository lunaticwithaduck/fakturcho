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

// County/province printing per country: IT folds the province into the city
// ("Roma (RM)"); RO and ES append it to the whole address line instead.
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
