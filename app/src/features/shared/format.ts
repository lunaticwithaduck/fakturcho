import type { Cents } from '@shared/types';

function groupThousands(value: number): string {
  const digits = String(value);
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }
  return groups.join(' ');
}

function splitCents(cents: Cents): { sign: string; wholePart: number; fractionPart: number } {
  const negative = cents < 0;
  const absoluteCents = Math.round(Math.abs(cents));
  return {
    sign: negative ? '-' : '',
    wholePart: Math.floor(absoluteCents / 100),
    fractionPart: absoluteCents % 100,
  };
}

export function formatCents(cents: Cents): string {
  const { sign, wholePart, fractionPart } = splitCents(cents);
  return `${sign}${groupThousands(wholePart)},${String(fractionPart).padStart(2, '0')}`;
}

export function formatMoney(cents: Cents): string {
  return `${formatCents(cents)} €`;
}

export function centsToEditableValue(cents: Cents | null): string {
  if (cents === null) return '';
  const { sign, wholePart, fractionPart } = splitCents(cents);
  return `${sign}${wholePart},${String(fractionPart).padStart(2, '0')}`;
}

export function parseMoneyInput(raw: string): Cents | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const negative = trimmed.startsWith('-');
  const withoutSign = negative ? trimmed.slice(1) : trimmed;
  const withoutThousands = withoutSign.replace(/\s/g, '');
  const normalized = withoutThousands.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [wholePart = '0', fractionPart = ''] = normalized.split('.');
  const cents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
