export type PeriodPreset = 'today' | '7d' | '30d' | 'month';

export const DEFAULT_PERIOD: PeriodPreset = '30d';

export const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Днес' },
  { value: '7d', label: '7 дни' },
  { value: '30d', label: '30 дни' },
  { value: 'month', label: 'Този месец' },
];

export function isPeriodPreset(value: string | null): value is PeriodPreset {
  return value === 'today' || value === '7d' || value === '30d' || value === 'month';
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function periodToRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const to = toIsoDate(now);
  if (preset === 'today') return { from: to, to };
  if (preset === 'month') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return { from: toIsoDate(from), to };
  }
  const daysBack = preset === '7d' ? 6 : 29;
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - daysBack);
  return { from: toIsoDate(from), to };
}
