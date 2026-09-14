const LEADING_POSTCODE_PATTERN = /^[\d-]+\s+/;

export function deriveTownFromAddress(address: string | null): string | null {
  if (!address) return null;
  const segments = address.split(',');
  const last = segments[segments.length - 1]?.trim() ?? '';
  const town = last.replace(LEADING_POSTCODE_PATTERN, '').trim();
  return town.length > 0 ? town : null;
}
