import type { VatCategory } from '../vat';
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
// "odwrotne obciążenie" (art. 106e ust. 1 pkt 18), added separately by plMentions
// whenever the ground below is exactly this string.
const PL_B2B_SERVICES_GROUND =
  'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b ustawy o podatku od towarów i usług';
// Art. 28b is not limited to an EU-established buyer — a business established
// in a third country is covered by the same rule, just with no Polish
// "odwrotne obciążenie" self-assessment to invoke, since that buyer is
// outside the EU VAT system entirely. Worded as its own string (not the exact
// PL_B2B_SERVICES_GROUND text) on purpose: plMentions matches that string
// exactly to print "odwrotne obciążenie", which would misstate the position
// for a non-EU buyer with nothing to self-assess.
const PL_THIRD_COUNTRY_B2B_SERVICES_GROUND =
  'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b ustawy o podatku od towarów i usług (usługobiorca spoza Unii Europejskiej)';

export const PL_EXEMPTION_GROUNDS = [
  PL_EXPORT_GROUND,
  PL_ICS_GROUND,
  PL_INTL_TRANSPORT_GROUND,
  PL_B2B_SERVICES_GROUND,
  PL_THIRD_COUNTRY_B2B_SERVICES_GROUND,
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
  PL_THIRD_COUNTRY_B2B_SERVICES_GROUND,
] as const;

// fa3-vat-groups.ts (bucketTags/vatRateCode) needs the line's real VatCategory
// to place it in the right FA(3) box — export goes to P_13_6_3 ("0 EX"), an
// intra-EU supply of goods to P_13_6_2 ("0 WDT"), international transport to
// P_13_6_1 ("0 KR"), and both not-subject grounds to P_13_8 ("np I"). Only
// the true exemptions (art. 43 ust. 1 pkt ... and the small-business ground)
// are genuinely "zw" (category E); a caller with no more specific mapping
// should fall back to E, not silently reuse one of the grounds below for an
// unrelated ground.
export const PL_GROUND_VAT_CATEGORIES: ReadonlyMap<string, VatCategory> = new Map([
  [PL_EXPORT_GROUND, 'G'],
  [PL_ICS_GROUND, 'K'],
  [PL_INTL_TRANSPORT_GROUND, 'Z'],
  [PL_B2B_SERVICES_GROUND, 'O'],
  [PL_THIRD_COUNTRY_B2B_SERVICES_GROUND, 'O'],
]);

// Of the vatNoteGrounds above, only these three are an actual 0%-rate supply
// (FA(3) P_12 "0 EX"/"0 WDT"/"0 KR") — the fourth, PL_B2B_SERVICES_GROUND, is
// out of scope entirely (art. 28b, "np II"), not a 0% rate.
const PL_ZERO_RATE_GROUNDS = [PL_EXPORT_GROUND, PL_ICS_GROUND, PL_INTL_TRANSPORT_GROUND] as const;

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
  nonEuB2bServicesGround: PL_THIRD_COUNTRY_B2B_SERVICES_GROUND,
  zeroRateGrounds: PL_ZERO_RATE_GROUNDS,
  // Sąd rejestrowy/kapitał zakładowy (KSH art. 206 § 1 for sp. z o.o., art. 374
  // for S.A.) are optional here since a sole trader has none of them.
  identifiers: [
    { key: 'krs', label: 'KRS', pattern: /^\d{10}$/, required: false },
    { key: 'regon', label: 'REGON', pattern: /^\d{9}(\d{5})?$/, required: false },
    { key: 'sadRejestrowy', label: 'Sąd rejestrowy', pattern: null, required: false },
    { key: 'kapitalZakladowy', label: 'Kapitał zakładowy', pattern: null, required: false },
  ],
  requiredIssuerFields: ['companyName', 'eik', 'street', 'postcode', 'city'],
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
};
