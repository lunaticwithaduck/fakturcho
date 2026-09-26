import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

// NOZ § 435 odst. 1 (zákon č. 89/2012 Sb.): only an entrepreneur entered in
// the Commercial Register — or, instead, in another public register or other
// evidence — must state that entry (court, section, insert) on business
// documents; an entrepreneur in no register at all owes nothing here. The
// field is therefore optional, unlike the once-blanket "required" reading.
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
    { key: 'companyRegister', label: 'Zápis v rejstříku', pattern: null, required: false },
  ],
  // §29 odst. 1 písm. h) zákona o DPH: DUZP is not a mandatory element once it
  // matches the issue date, but Czech practice prints it unconditionally.
  taxEventDateAlwaysShown: true,
};
