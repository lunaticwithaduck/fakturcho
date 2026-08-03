const BG_MONTH_NAMES = [
  'януари',
  'февруари',
  'март',
  'април',
  'май',
  'юни',
  'юли',
  'август',
  'септември',
  'октомври',
  'ноември',
  'декември',
];

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

export function formatMonthLabel(monthKey: string): string {
  const parts = monthKey.split('-');
  const yearPart = parts[0] ?? '';
  const monthPart = parts[1] ?? '1';
  const monthIndex = Number(monthPart) - 1;
  const name = BG_MONTH_NAMES[monthIndex] ?? monthKey;
  return `${name} ${yearPart}`;
}
