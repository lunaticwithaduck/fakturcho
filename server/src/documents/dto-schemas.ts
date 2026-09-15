import {
  DOCUMENT_LANGUAGES,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  VAT_CATEGORIES,
} from '@fakturcho/shared-types';
import { z } from 'zod';
import { isoDateSchema, paymentMeansCodeSchema } from '../common/eu-field-schemas';

const lineItemInputSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  unitPrice: z.number().int(),
  sortOrder: z.number().int(),
  vatRateBp: z.number().int().optional(),
  vatCategory: z.enum(VAT_CATEGORIES).optional(),
  unitCode: z.string().nullish(),
});

const discountInputSchema = z.object({
  label: z.string().min(1),
  percentBp: z.number().int().nullish(),
  amount: z.number().int().nullish(),
  sortOrder: z.number().int().optional(),
});

export const saveDraftRequestSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  referenceNumber: z.string().nullish(),
  originalDocumentId: z.string().nullish(),
  taxEventAt: z.string().nullish(),
  dueAt: z.string().nullish(),
  validUntil: z.string().nullish(),
  deliveryDate: isoDateSchema.nullish(),
  buyerReference: z.string().nullish(),
  paymentMeansCode: paymentMeansCodeSchema.nullish(),
  paymentTermsNote: z.string().nullish(),
  transportReason: z.string().nullish(),
  transportedAt: z.string().nullish(),
  carrierName: z.string().nullish(),
  transportNote: z.string().nullish(),
  vatIncluded: z.boolean().optional(),
  vatExemptionGround: z.string().nullish(),
  clientId: z.string().nullish(),
  preparedBy: z.string().nullish(),
  notes: z.string().nullish(),
  emailText: z.string().nullish(),
  templateId: z.string().optional(),
  documentLanguage: z.enum(DOCUMENT_LANGUAGES).nullish(),
  lineItems: z.array(lineItemInputSchema),
  discounts: z.array(discountInputSchema).optional(),
});

export const issueDocumentRequestSchema = z.object({
  issuedAt: z.string().optional(),
  overrideNumber: z.number().int().positive().optional(),
});

export const documentListQuerySchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES).optional(),
  status: z.enum(DOCUMENT_STATUSES).optional(),
  clientId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});
