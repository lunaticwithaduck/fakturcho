import { FEATURE_FLAG_KEYS } from '@fakturcho/shared-types';
import { z } from 'zod';

export const featureFlagKeySchema = z.enum(FEATURE_FLAG_KEYS);

export const updateFeatureFlagSchema = z.object({
  enabled: z.boolean(),
});
