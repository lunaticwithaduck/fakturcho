import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

const FR_DEFAULT_EXEMPTION_GROUND = 'TVA non applicable, art. 293 B du CGI';

const FR_AUTOLIQUIDATION_GROUND =
  'Autoliquidation – TVA due par le preneur, art. 259-1 du CGI et art. 196 de la directive 2006/112/CE';

const FR_EXEMPTION_GROUNDS = [
  'Exonération de TVA, article 262 ter I du CGI',
  'Exonération de TVA, article 262 I du CGI',
  FR_AUTOLIQUIDATION_GROUND,
] as const;

export const FR_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'FR',
  language: 'fr',
  timeZone: 'Europe/Paris',
  vatRates: [
    { rateBp: 2000, label: '20%' },
    { rateBp: 1000, label: '10%' },
    { rateBp: 550, label: '5,5%' },
    { rateBp: 210, label: '2,1%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2000,
  companyIdLabel: 'SIREN',
  vatNumberPattern: /^FR[0-9A-Z]{2}\d{9}$/,
  exemptionGrounds: FR_EXEMPTION_GROUNDS,
  defaultExemptionGround: FR_DEFAULT_EXEMPTION_GROUND,
  vatNoteGrounds: [
    FR_AUTOLIQUIDATION_GROUND,
    FR_DEFAULT_EXEMPTION_GROUND,
    'Exonération de TVA, article 262 ter I du CGI',
    'Exonération de TVA, article 262 I du CGI',
  ],
  identifiers: [
    { key: 'siret', label: 'SIRET', pattern: /^\d{14}$/, required: false },
    { key: 'rcs', label: 'RCS', pattern: null, required: false },
    { key: 'legalForm', label: 'Forme juridique', pattern: null, required: false },
    { key: 'shareCapital', label: 'Capital social', pattern: null, required: false },
  ],
  requiredIssuerFields: ['companyName', 'eik', 'street', 'postcode', 'city'],
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
  // C. com. art. L441-10 I: between professionals, the agreed payment term
  // cannot exceed 60 days from the invoice date (or 45 days end-of-month).
  maxPaymentTermsDays: 60,
};
