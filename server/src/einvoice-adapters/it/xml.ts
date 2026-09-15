export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function el(tag: string, value: string): string {
  return `<${tag}>${escapeXml(value)}</${tag}>`;
}

export function optionalEl(tag: string, value: string | null | undefined): string {
  return value ? el(tag, value) : '';
}

export function toAmountString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function toRateString(rateBp: number): string {
  return (rateBp / 100).toFixed(2);
}

export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}
