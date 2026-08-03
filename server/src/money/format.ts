import type { Cents } from '@fakturcho/shared-types';

function groupThousands(value: number): string {
  const digits = String(value);
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }
  return groups.join(' ');
}

export function formatCents(cents: Cents): string {
  const negative = cents < 0;
  const absoluteCents = Math.round(Math.abs(cents));
  const wholePart = Math.floor(absoluteCents / 100);
  const fractionPart = absoluteCents % 100;
  const sign = negative ? '-' : '';
  return `${sign}${groupThousands(wholePart)},${String(fractionPart).padStart(2, '0')}`;
}

export function formatEur(cents: Cents): string {
  return `${formatCents(cents)} €`;
}

export function formatBgn(bgnCents: Cents): string {
  return `${formatCents(bgnCents)} лв.`;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}
