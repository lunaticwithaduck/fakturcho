export const TARGET_COUNTRIES = ['BG', 'DE', 'FR', 'IT', 'PL', 'RO', 'ES'] as const;
export type TargetCountry = (typeof TARGET_COUNTRIES)[number];
