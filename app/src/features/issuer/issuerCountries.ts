import { EU_VAT_AREA_COUNTRIES } from '@fakturcho/shared-types';

const NON_EU_ISSUER_COUNTRIES = ['GB', 'US', 'CH', 'NO'] as const;

export const ISSUER_COUNTRY_CODES: readonly string[] = [
  'BG',
  ...EU_VAT_AREA_COUNTRIES.filter((code) => code !== 'BG' && code !== 'ES').sort(),
  ...NON_EU_ISSUER_COUNTRIES,
];
