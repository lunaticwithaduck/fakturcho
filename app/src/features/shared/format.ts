import type { Cents, Locale } from '@shared/types';
import { decimalSeparator, parseMoneyInputForTag } from './money-parse';

const EN_LOCALE_TAG = 'en-IE';

// bg keeps its own hand-rolled formatter (byte-identical, no ICU dependency);
// en keeps its existing en-IE formatting untouched. Every other published
// locale gets real Intl formatting driven by this tag, not a copy of en's.
const INTL_TAGS: Partial<Record<Locale, string>> = {
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pl: 'pl-PL',
  ro: 'ro-RO',
};

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

export function formatSignedMoney(cents: Cents): string {
  return cents > 0 ? `+${formatMoney(cents)}` : formatMoney(cents);
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

function formatCentsEn(cents: Cents): string {
  const { sign, wholePart, fractionPart } = splitCents(cents);
  return `${sign}${new Intl.NumberFormat(EN_LOCALE_TAG).format(wholePart)}.${String(fractionPart).padStart(2, '0')}`;
}

function formatCentsForTag(cents: Cents, tag: string): string {
  const { sign, wholePart, fractionPart } = splitCents(cents);
  const grouped = new Intl.NumberFormat(tag).format(wholePart);
  return `${sign}${grouped}${decimalSeparator(tag)}${String(fractionPart).padStart(2, '0')}`;
}

export function formatCentsForLocale(cents: Cents, locale: Locale): string {
  if (locale === 'bg') return formatCents(cents);
  const tag = INTL_TAGS[locale];
  return tag ? formatCentsForTag(cents, tag) : formatCentsEn(cents);
}

export function formatMoneyForLocale(cents: Cents, locale: Locale): string {
  if (locale === 'bg') return formatMoney(cents);
  return `${formatCentsForLocale(cents, locale)} €`;
}

function parseMoneyInputEn(raw: string): Cents | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const negative = trimmed.startsWith('-');
  const withoutSign = negative ? trimmed.slice(1) : trimmed;
  const withoutThousands = withoutSign.replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(withoutThousands)) return null;
  const [wholePart = '0', fractionPart = ''] = withoutThousands.split('.');
  const cents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function parseMoneyInputForLocale(raw: string, locale: Locale): Cents | null {
  if (locale === 'bg') return parseMoneyInput(raw);
  const tag = INTL_TAGS[locale];
  return tag ? parseMoneyInputForTag(raw, tag) : parseMoneyInputEn(raw);
}

function formatDateForTag(value: string, tag: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return '';
  const [, year, month, day] = match;
  return new Intl.DateTimeFormat(tag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

export function formatDateForLocale(value: string | null | undefined, locale: Locale): string {
  if (!value) return '';
  if (locale === 'bg') return formatDate(value);
  const tag = INTL_TAGS[locale];
  return formatDateForTag(value, tag ?? EN_LOCALE_TAG);
}
