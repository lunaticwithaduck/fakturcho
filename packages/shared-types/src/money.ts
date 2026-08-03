export type Cents = number;

export const EUR_BGN_PEG = 1.95583;

export const CURRENCY_CODES = ['EUR'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export function eurCentsToBgnCents(eurCents: Cents): Cents {
  return Math.round(eurCents * EUR_BGN_PEG + Number.EPSILON);
}
