import type { CountryConfig } from './base';

type RateOverride = Pick<CountryConfig, 'vatRates' | 'defaultVatRateBp' | 'timeZone'>;

// gov.uk/vat-rates, verified 2026-09-26: standard rate 20% ("most goods and
// services"), reduced rate 5% (e.g. children's car seats, home energy),
// zero rate 0% (e.g. most food, children's clothes).
const GB: RateOverride = {
  vatRates: [
    { rateBp: 2000, label: '20%' },
    { rateBp: 500, label: '5%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2000,
  timeZone: 'Europe/London',
};

// estv.admin.ch/en/vat-rates-switzerland, verified 2026-09-26: rates in force
// since 1 January 2024, unchanged for 2026 — normal rate 8.1%, reduced rate
// 2.6% (e.g. foodstuffs, books/newspapers, menstrual hygiene products),
// special rate 3.8% (hotel/holiday accommodation).
const CH: RateOverride = {
  vatRates: [
    { rateBp: 810, label: '8.1%' },
    { rateBp: 380, label: '3.8%' },
    { rateBp: 260, label: '2.6%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 810,
  timeZone: 'Europe/Zurich',
};

// skatteetaten.no/en/rates/value-added-tax, verified 2026-09-26: general
// (standard) rate 25%, reduced rate 15% (foodstuffs), reduced rate 12%
// (passenger transport, accommodation, cinema, broadcasting, museums/amusement
// parks, sporting events).
const NO: RateOverride = {
  vatRates: [
    { rateBp: 2500, label: '25%' },
    { rateBp: 1500, label: '15%' },
    { rateBp: 1200, label: '12%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2500,
  timeZone: 'Europe/Oslo',
};

export const NON_EU_RATE_OVERRIDES: Record<string, RateOverride> = { GB, CH, NO };
