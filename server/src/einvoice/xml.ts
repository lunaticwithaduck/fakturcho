export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function textEl(tag: string, value: string): string {
  return `<${tag}>${escapeXml(value)}</${tag}>`;
}

export function optionalTextEl(tag: string, value: string | null): string {
  return value === null ? '' : textEl(tag, value);
}

export function toDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function toPercentString(rateBp: number): string {
  return (rateBp / 100).toFixed(2);
}

export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}
