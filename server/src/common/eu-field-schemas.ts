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
export const paymentMeansCodeSchema = z
  .string()
  .regex(/^\d{1,3}$/, 'must be a UNCL4461 numeric code');
