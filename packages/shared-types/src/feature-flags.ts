export const FEATURE_FLAG_KEYS = ['EN_LOCALE', 'EINVOICE', 'PEPPOL'] as const;
export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlagsDto = Record<FeatureFlagKey, boolean>;

export interface AdminFeatureFlagDto {
  key: FeatureFlagKey;
  enabled: boolean;
  updatedAt: string;
}

export interface UpdateFeatureFlagRequest {
  enabled: boolean;
}
