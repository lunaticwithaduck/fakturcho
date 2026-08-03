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
