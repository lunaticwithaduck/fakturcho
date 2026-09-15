import type { Cents } from '@shared/types';

const SPACE_CHARS = [' ', ' ', ' '];
const SEPARATOR_PATTERN = /[.,   ]/g;

// A locale's grouping behaviour only shows up on a number long enough to be
// grouped at all — it-IT, es-ES and pl-PL don't group four-digit numbers, so
// probing with 1234 falls back to their decimal separator instead.
const SEPARATOR_PROBE = 1234567.89;

function isSpaceChar(value: string): boolean {
  return SPACE_CHARS.includes(value);
}

export function decimalSeparator(tag: string): string {
  const part = new Intl.NumberFormat(tag)
    .formatToParts(SEPARATOR_PROBE)
    .find((p) => p.type === 'decimal');
  return part?.value ?? '.';
}

function groupSeparator(tag: string): string {
  const part = new Intl.NumberFormat(tag)
    .formatToParts(SEPARATOR_PROBE)
    .find((p) => p.type === 'group');
  return part?.value ?? ',';
}

function isValidGroupedInteger(value: string, group: string): boolean {
  const parts = value.split(group);
  if (parts.length === 1) return /^\d+$/.test(parts[0] ?? '');
  const [first, ...rest] = parts;
  if (!first || !/^\d{1,3}$/.test(first)) return false;
  return rest.every((part) => /^\d{3}$/.test(part));
}

export function parseMoneyInputForTag(raw: string, tag: string): Cents | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const negative = trimmed.startsWith('-');
  const withoutSign = negative ? trimmed.slice(1) : trimmed;
  const group = groupSeparator(tag);
  const normalized = isSpaceChar(group) ? withoutSign.replace(/[   ]/g, group) : withoutSign;

  const separators = [...normalized.matchAll(SEPARATOR_PATTERN)];
  let wholePart: string | null = null;
  let fractionPart = '';

  const last = separators.at(-1);
  if (last?.index !== undefined) {
    const beforeLast = normalized.slice(0, last.index);
    const afterLast = normalized.slice(last.index + 1);
    if (
      /^\d{1,2}$/.test(afterLast) &&
      (beforeLast === '' || isValidGroupedInteger(beforeLast, group))
    ) {
      wholePart = beforeLast === '' ? '0' : beforeLast.split(group).join('');
      fractionPart = afterLast;
    }
  }

  if (wholePart === null) {
    if (!isValidGroupedInteger(normalized, group)) return null;
    wholePart = normalized.split(group).join('');
  }

  if (wholePart === '' || !/^\d+$/.test(wholePart)) return null;
  const cents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'));
  return negative ? -cents : cents;
}
