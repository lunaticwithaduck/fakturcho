import { PAYMENT_TERMS_DAY_OPTIONS } from '@fakturcho/shared-types';
import type { PaymentTermsDayOption } from '@shared/types';

export function paymentTermsDayOptionsUpTo(maxDays?: number): readonly PaymentTermsDayOption[] {
  return PAYMENT_TERMS_DAY_OPTIONS.filter(
    (days): days is PaymentTermsDayOption => maxDays === undefined || days <= maxDays,
  );
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
