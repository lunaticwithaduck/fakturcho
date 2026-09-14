import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

const DE_EXEMPTION_GROUNDS = [
  'Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG',
  'Steuerfreie Ausfuhrlieferung gemäß § 4 Nr. 1 Buchst. a i. V. m. § 6 UStG',
  'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG',
] as const;

const DE_DEFAULT_EXEMPTION_GROUND = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';

export const DE_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'DE',
  language: 'de',
  vatRates: [
    { rateBp: 1900, label: '19%' },
    { rateBp: 700, label: '7%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 1900,
  companyIdLabel: 'Handelsregisternummer',
  vatNumberPattern: /^DE\d{9}$/,
  exemptionGrounds: DE_EXEMPTION_GROUNDS,
  defaultExemptionGround: DE_DEFAULT_EXEMPTION_GROUND,
  identifiers: [{ key: 'steuernummer', label: 'Steuernummer', pattern: null, required: true }],
  requiredIssuerFields: ['companyName', 'street', 'postcode', 'city'],
  showMol: false,
  showSignatureRow: false,
  showDualDisplay: false,
  showOriginalStamp: false,
};
