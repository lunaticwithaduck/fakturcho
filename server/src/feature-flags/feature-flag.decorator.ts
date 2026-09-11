import type { FeatureFlagKey } from '@fakturcho/shared-types';
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FEATURE_FLAG_KEY = 'requireFeatureFlag';

export const RequireFeatureFlag = (key: FeatureFlagKey) =>
  SetMetadata(REQUIRE_FEATURE_FLAG_KEY, key);
