export const DEFAULT_VAT_RATE_BP = 2000;

export const DEFAULT_EXEMPTION_GROUND = 'чл. 113, ал. 9 от ЗДДС';

export const VAT_EXEMPTION_GROUNDS = [
  'Обратно начисляване – чл. 21, ал. 2 от ЗДДС',
  'чл. 22 от ЗДДС',
  'чл. 28 от ЗДДС',
  'чл. 30, ал. 1 от ЗДДС',
  'чл. 39 от ЗДДС',
  'чл. 41 от ЗДДС',
  'чл. 47 от ЗДДС',
  'чл. 53, ал. 1 от ЗДДС',
  'чл. 141 2006/112/ЕО',
] as const;

export type VatExemptionGround = string;

export const VAT_CATEGORIES = ['S', 'Z', 'E', 'AE', 'K', 'G', 'O'] as const;
export type VatCategory = (typeof VAT_CATEGORIES)[number];

export const VAT_CATEGORY_LABELS: Record<VatCategory, string> = {
  S: 'Standard rate',
  Z: 'Zero rated',
  E: 'Exempt',
  AE: 'Reverse charge',
  K: 'Intra-community supply',
  G: 'Export outside the EU',
  O: 'Outside scope of VAT',
};

export interface VatSubtotal {
  vatCategory: VatCategory;
  rateBp: number;
  taxableAmount: number;
  vatAmount: number;
}
