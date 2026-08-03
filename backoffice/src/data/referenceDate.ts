export const REFERENCE_DATE = new Date('2026-08-03T00:00:00.000Z');

export function daysAgoIso(days: number): string {
  const date = new Date(REFERENCE_DATE);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

export function daysAheadIso(days: number): string {
  const date = new Date(REFERENCE_DATE);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function monthKeyOf(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function monthsAgoDate(monthsAgo: number): Date {
  const date = new Date(REFERENCE_DATE);
  date.setUTCMonth(date.getUTCMonth() - monthsAgo);
  return date;
}

export function monthsAgoKey(monthsAgo: number): string {
  return monthKeyOf(monthsAgoDate(monthsAgo));
}
