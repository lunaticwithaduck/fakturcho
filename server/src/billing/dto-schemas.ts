import { CREDIT_PACK_IDS } from '@fakturcho/shared-types';
import { z } from 'zod';

export const checkoutRequestSchema = z.object({
  product: z.enum([...CREDIT_PACK_IDS, 'subscription'] as const),
});
