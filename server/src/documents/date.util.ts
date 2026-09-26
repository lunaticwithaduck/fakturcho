export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  return new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
}

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
