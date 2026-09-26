import type { CountryConfig } from './base';

type RawRate = readonly [bp: number, label: string];
type RawRates = readonly [RawRate, ...RawRate[]];
type RateOverride = Pick<CountryConfig, 'vatRates' | 'defaultVatRateBp' | 'timeZone'>;

const RAW_EU_STANDARD_RATES: Record<string, { rates: RawRates; timeZone: string }> = {
  AT: {
    rates: [
      [2000, '20%'],
      [1300, '13%'],
      [1000, '10%'],
      [490, '4.9%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Vienna',
  },
  BE: {
    rates: [
      [2100, '21%'],
      [1200, '12%'],
      [600, '6%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Brussels',
  },
  CY: {
    rates: [
      [1900, '19%'],
      [900, '9%'],
      [500, '5%'],
      [0, '0%'],
    ],
    timeZone: 'Asia/Nicosia',
  },
  DK: {
    rates: [
      [2500, '25%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Copenhagen',
  },
  EE: {
    rates: [
      [2400, '24%'],
      [1300, '13%'],
      [900, '9%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Tallinn',
  },
  FI: {
    rates: [
      [2550, '25.5%'],
      [1350, '13.5%'],
      [1000, '10%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Helsinki',
  },
  GR: {
    rates: [
      [2400, '24%'],
      [1300, '13%'],
      [600, '6%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Athens',
  },
  HR: {
    rates: [
      [2500, '25%'],
      [1300, '13%'],
      [500, '5%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Zagreb',
  },
  HU: {
    rates: [
      [2700, '27%'],
      [1800, '18%'],
      [500, '5%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Budapest',
  },
  IE: {
    rates: [
      [2300, '23%'],
      [1350, '13.5%'],
      [900, '9%'],
      [480, '4.8%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Dublin',
  },
  LT: {
    rates: [
      [2100, '21%'],
      [1200, '12%'],
      [1000, '10%'],
      [500, '5%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Vilnius',
  },
  LU: {
    rates: [
      [1700, '17%'],
      [1400, '14%'],
      [800, '8%'],
      [300, '3%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Luxembourg',
  },
  LV: {
    rates: [
      [2100, '21%'],
      [1200, '12%'],
      [500, '5%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Riga',
  },
  MT: {
    rates: [
      [1800, '18%'],
      [700, '7%'],
      [500, '5%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Malta',
  },
  NL: {
    rates: [
      [2100, '21%'],
      [900, '9%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Amsterdam',
  },
  PT: {
    rates: [
      [2300, '23%'],
      [1300, '13%'],
      [600, '6%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Lisbon',
  },
  SE: {
    rates: [
      [2500, '25%'],
      [1200, '12%'],
      [600, '6%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Stockholm',
  },
  SI: {
    rates: [
      [2200, '22%'],
      [950, '9.5%'],
      [500, '5%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Ljubljana',
  },
  SK: {
    rates: [
      [2300, '23%'],
      [1900, '19%'],
      [500, '5%'],
      [0, '0%'],
    ],
    timeZone: 'Europe/Bratislava',
  },
};

function toRateOverride(entry: { rates: RawRates; timeZone: string }): RateOverride {
  return {
    vatRates: entry.rates.map(([rateBp, label]) => ({ rateBp, label })),
    defaultVatRateBp: entry.rates[0][0],
    timeZone: entry.timeZone,
  };
}

export const EU_RATE_OVERRIDES: Record<string, RateOverride> = Object.fromEntries(
  Object.entries(RAW_EU_STANDARD_RATES).map(([country, entry]) => [country, toRateOverride(entry)]),
);
