import type { Cents } from '@fakturcho/shared-types';

export function parseCents(input: string): Cents {
  const trimmed = input.trim();
  if (trimmed === '') throw new Error('Empty amount');
  const negative = trimmed.startsWith('-');
  const withoutSign = negative ? trimmed.slice(1) : trimmed;
  const withoutThousands = withoutSign.replace(/[\s\u00A0]/g, '');
  const normalized = withoutThousands.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid amount: ${input}`);
  }
  const [wholePart = '0', fractionPart = ''] = normalized.split('.');
  const cents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function parseDate(input: string): Date {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(input.trim());
  if (!match) throw new Error(`Invalid date: ${input}`);
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}
