import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

const PL_SMALL_BUSINESS_GROUND =
  'podatnik zwolniony podmiotowo z podatku od towarów i usług na podstawie art. 113 ust. 1 i 9 ustawy o podatku od towarów i usług';

export const PL_EXEMPTION_GROUNDS = [
  'eksport towarów – art. 41 ust. 4 i 5 ustawy o podatku od towarów i usług',
  'wewnątrzwspólnotowa dostawa towarów – art. 42 ust. 1 ustawy o podatku od towarów i usług',
  'usługi w zakresie transportu międzynarodowego – art. 83 ust. 1 ustawy o podatku od towarów i usług',
  'zwolnienie przedmiotowe – art. 43 ust. 1 ustawy o podatku od towarów i usług',
] as const;

export const PL_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'PL',
  language: 'pl',
  timeZone: 'Europe/Warsaw',
  vatRates: [
    { rateBp: 2300, label: '23%' },
    { rateBp: 800, label: '8%' },
    { rateBp: 500, label: '5%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2300,
  companyIdLabel: 'NIP',
  vatNumberPattern: /^PL\d{10}$/,
  exemptionGrounds: PL_EXEMPTION_GROUNDS,
  defaultExemptionGround: PL_SMALL_BUSINESS_GROUND,
  identifiers: [
    { key: 'krs', label: 'KRS', pattern: /^\d{10}$/, required: false },
    { key: 'regon', label: 'REGON', pattern: /^\d{9}(\d{5})?$/, required: false },
  ],
  requiredIssuerFields: ['companyName', 'eik', 'street', 'postcode', 'city'],
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
};
