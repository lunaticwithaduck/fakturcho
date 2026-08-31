import { CREDIT_PACK_IDS } from '@fakturcho/shared-types';
import { z } from 'zod';

// Wise has no recurring-charge mechanism here (bank transfer, no mandate) — credit packs only.
export const checkoutRequestSchema = z.object({
  product: z.enum(CREDIT_PACK_IDS),
});
