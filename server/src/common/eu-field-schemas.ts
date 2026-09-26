import { isPaymentTermsDayOption } from '@fakturcho/shared-types';
import { z } from 'zod';

export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, 'must be an ISO 3166-1 alpha-2 code');
export const streetSchema = z.string().min(1).max(200);
export const postcodeSchema = z.string().min(1).max(20);
export const countyRegionSchema = z.string().min(1).max(10);
export const peppolEndpointIdSchema = z.string().min(1).max(50);
export const peppolSchemeSchema = z.string().regex(/^\d{4}$/, 'must be a 4-digit Peppol scheme id');
export const sdiRecipientCodeSchema = z
  .string()
  .regex(/^[A-Za-z0-9]{6,7}$/, 'must be a 6-7 character SDI code');
export const pecSchema = z.string().email();
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

function isValidCalendarDateTime(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute] = match;
  if (Number(month) < 1 || Number(month) > 12) return false;
  if (Number(hour) > 23 || Number(minute) > 59) return false;
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return Number(day) >= 1 && Number(day) <= daysInMonth;
}

// A wall-clock reading with no timezone of its own — the issuer's country
// timezone gives it meaning (see documents/timezone.util.ts).
export const wallClockDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'must be YYYY-MM-DDTHH:mm')
  .refine(isValidCalendarDateTime, 'must be a valid calendar date and time');
export const paymentMeansCodeSchema = z
  .string()
  .regex(/^\d{1,3}$/, 'must be a UNCL4461 numeric code');
export const paymentTermsDaysSchema = z
  .number()
  .int()
  .refine(isPaymentTermsDayOption, 'must be one of the offered payment-term day counts');
