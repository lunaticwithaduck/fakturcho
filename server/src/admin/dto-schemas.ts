import { DOCUMENT_STATUSES, DOCUMENT_TYPES, SUBSCRIPTION_STATUSES } from '@fakturcho/shared-types';
import { z } from 'zod';

export const accountListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum([...SUBSCRIPTION_STATUSES, 'none', 'all']).optional(),
});

export const adminDocumentListQuerySchema = z.object({
  search: z.string().optional(),
  documentType: z.enum([...DOCUMENT_TYPES, 'all']).optional(),
  status: z.enum([...DOCUMENT_STATUSES, 'all']).optional(),
});

export const subscriptionListQuerySchema = z.object({
  status: z.enum([...SUBSCRIPTION_STATUSES, 'all']).optional(),
});

export const turnoverQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM'),
});

export const trafficQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
    .optional(),
});
