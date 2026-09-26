import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

// NOZ § 435 odst. 1 (zákon č. 89/2012 Sb.): every entrepreneur must state
// their entry in the Commercial Register (court, section, insert) — or, for
// an entrepreneur entered in another public register instead, that entry —
// on business documents. Unlike the free-text field GENERIC_EU_CONFIG offers
// unconfigured EU countries, CZ requires it.
export const CZ_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'CZ',
  timeZone: 'Europe/Prague',
  vatRates: [
    { rateBp: 2100, label: '21%' },
    { rateBp: 1200, label: '12%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2100,
  identifiers: [
    { key: 'companyRegister', label: 'Zápis v rejstříku', pattern: null, required: true },
  ],
  // §29 odst. 1 písm. h) zákona o DPH: DUZP is not a mandatory element once it
  // matches the issue date, but Czech practice prints it unconditionally.
  taxEventDateAlwaysShown: true,
};
