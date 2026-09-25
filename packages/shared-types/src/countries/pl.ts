import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

const PL_SMALL_BUSINESS_GROUND =
  'podatnik zwolniony podmiotowo z podatku od towarów i usług na podstawie art. 113 ust. 1 i 9 ustawy o podatku od towarów i usług';

// 0%-rate and not-subject grounds: these state a legal basis, not an exemption,
// so CountryConfig.vatNoteGrounds below prints them without labels.exemptionPrefix.
const PL_EXPORT_GROUND = 'eksport towarów – art. 41 ust. 4 i 5 ustawy o podatku od towarów i usług';
const PL_ICS_GROUND =
  'wewnątrzwspólnotowa dostawa towarów – art. 42 ust. 1 ustawy o podatku od towarów i usług';
const PL_INTL_TRANSPORT_GROUND =
  'usługi w zakresie transportu międzynarodowego – art. 83 ust. 1 pkt 23 ustawy o podatku od towarów i usług';
// B2B service to a taxpayer established in another EU country: not taxable in
// Poland at all (art. 28b) — the buyer self-assesses, so the invoice carries
// "odwrotne obciążenie" (art. 106e ust. 1 pkt 18), added separately by plMentions.
const PL_B2B_SERVICES_GROUND =
  'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b ustawy o podatku od towarów i usług';

export const PL_EXEMPTION_GROUNDS = [
  PL_EXPORT_GROUND,
  PL_ICS_GROUND,
  PL_INTL_TRANSPORT_GROUND,
  PL_B2B_SERVICES_GROUND,
  'usługi udzielania kredytów lub pożyczek pieniężnych – art. 43 ust. 1 pkt 38 ustawy o podatku od towarów i usług',
  'usługi ubezpieczeniowe – art. 43 ust. 1 pkt 37 ustawy o podatku od towarów i usług',
  'usługi w zakresie opieki medycznej – art. 43 ust. 1 pkt 18 ustawy o podatku od towarów i usług',
  'usługi w zakresie kształcenia – art. 43 ust. 1 pkt 26 ustawy o podatku od towarów i usług',
  'wynajem nieruchomości mieszkalnych na cele mieszkaniowe – art. 43 ust. 1 pkt 36 ustawy o podatku od towarów i usług',
] as const;

const PL_VAT_NOTE_GROUNDS = [
  PL_EXPORT_GROUND,
  PL_ICS_GROUND,
  PL_INTL_TRANSPORT_GROUND,
  PL_B2B_SERVICES_GROUND,
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
  vatNoteGrounds: PL_VAT_NOTE_GROUNDS,
  identifiers: [
    { key: 'krs', label: 'KRS', pattern: /^\d{10}$/, required: false },
    { key: 'regon', label: 'REGON', pattern: /^\d{9}(\d{5})?$/, required: false },
  ],
  requiredIssuerFields: ['companyName', 'eik', 'street', 'postcode', 'city'],
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
};
