import type { Cents, DocumentLanguage } from '@fakturcho/shared-types';

const EN_LOCALE_TAG = 'en-IE';

interface NumberConvention {
  thousands: string;
  decimal: string;
  dateSeparator: string;
}

const CONVENTIONS: Record<DocumentLanguage, NumberConvention> = {
  bg: { thousands: ' ', decimal: ',', dateSeparator: '.' },
  en: { thousands: ',', decimal: '.', dateSeparator: '/' },
  de: { thousands: '.', decimal: ',', dateSeparator: '.' },
  fr: { thousands: ' ', decimal: ',', dateSeparator: '/' },
  it: { thousands: '.', decimal: ',', dateSeparator: '/' },
  pl: { thousands: ' ', decimal: ',', dateSeparator: '.' },
  ro: { thousands: '.', decimal: ',', dateSeparator: '.' },
};

export function decimalSeparatorForLocale(language: DocumentLanguage): string {
  return CONVENTIONS[language].decimal;
}

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

export function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

function splitCentsForLocale(cents: Cents): {
  sign: string;
  wholePart: number;
  fractionPart: number;
} {
  const negative = cents < 0;
  const absoluteCents = Math.round(Math.abs(cents));
  return {
    sign: negative ? '-' : '',
    wholePart: Math.floor(absoluteCents / 100),
    fractionPart: absoluteCents % 100,
  };
}

function formatCentsEn(cents: Cents): string {
  const { sign, wholePart, fractionPart } = splitCentsForLocale(cents);
  return `${sign}${new Intl.NumberFormat(EN_LOCALE_TAG).format(wholePart)}.${String(fractionPart).padStart(2, '0')}`;
}

export function formatCentsForLocale(cents: Cents, language: DocumentLanguage): string {
  if (language === 'bg') return formatCents(cents);
  if (language === 'en') return formatCentsEn(cents);
  const { sign, wholePart, fractionPart } = splitCentsForLocale(cents);
  const { thousands, decimal } = CONVENTIONS[language];
  const grouped = groupThousands(wholePart).replace(/ /g, thousands);
  return `${sign}${grouped}${decimal}${String(fractionPart).padStart(2, '0')}`;
}

export function formatMoneyForLocale(cents: Cents, language: DocumentLanguage): string {
  if (language === 'en') {
    const amount = formatCentsEn(Math.abs(cents));
    return cents < 0 ? `-€${amount}` : `€${amount}`;
  }
  return `${formatCentsForLocale(cents, language)} €`;
}

export function formatDateForLocale(value: Date | string, language: DocumentLanguage): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const separator = CONVENTIONS[language].dateSeparator;
  return [day, month, year].join(separator);
}

export function formatDateTimeForLocale(
  value: Date | string,
  language: DocumentLanguage,
  timeZone: string,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const separator = CONVENTIONS[language].dateSeparator;
  const datePart = [get('day'), get('month'), get('year')].join(separator);
  return `${datePart}, ${get('hour')}:${get('minute')}`;
}
