export const DEFAULT_VAT_RATE_BP = 2000;

export const DEFAULT_EXEMPTION_GROUND = 'чл.113, ал.9 от ЗДДС';

export const VAT_EXEMPTION_GROUNDS = [
  'чл.21 от ЗДДС',
  'чл.22 от ЗДДС',
  'чл.28 + чл.86 от ЗДДС',
  'чл.28c(E)(3) 77/388/EEC',
  'чл.30 ал.1 от ЗДДС',
  'чл.39 ал.1 от ЗДДС',
  'чл.41 от ЗДДС',
  'чл.47 от ЗДДС',
  'чл.69 ал.2 + чл.21 ал.2 от ЗДДС',
  'чл.84 + чл.17 от ЗДДС',
  'чл.86 ал.1 ППЗДДС',
] as const;

export type VatExemptionGround =
  | typeof DEFAULT_EXEMPTION_GROUND
  | (typeof VAT_EXEMPTION_GROUNDS)[number];
