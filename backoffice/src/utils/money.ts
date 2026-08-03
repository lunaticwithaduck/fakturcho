import type { Cents } from '@fakturcho/shared-types';

export function formatCents(cents: Cents): string {
  const sign = cents < 0 ? '-' : '';
  const absoluteCents = Math.abs(cents);
  const integerPart = Math.floor(absoluteCents / 100);
  const fractionPart = String(absoluteCents % 100).padStart(2, '0');
  const grouped = String(integerPart).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${grouped},${fractionPart} €`;
}
