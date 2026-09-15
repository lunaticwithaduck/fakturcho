export type Cents = number;

export const CURRENCY_CODES = ['EUR'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}
