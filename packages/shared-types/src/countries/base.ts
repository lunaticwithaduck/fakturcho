import type { DocumentLanguage, Locale } from '../languages';
import type { VatExemptionGround } from '../vat';

export interface VatRateOption {
  rateBp: number;
  label: string;
}

export interface IssuerIdentifierField {
  key: string;
  label: string;
  pattern: RegExp | null;
  required: boolean;
}

export interface CountyRegionField {
  label: string;
  required: boolean;
  pattern: RegExp | null;
}

export interface CountryConfig {
  country: string;
  locale: Locale;
  language: DocumentLanguage;
  vatRates: VatRateOption[];
  defaultVatRateBp: number;
  companyIdLabel: string;
  vatNumberPattern: RegExp | null;
  exemptionGrounds: readonly VatExemptionGround[];
  defaultExemptionGround: VatExemptionGround | null;
  identifiers: readonly IssuerIdentifierField[];
  numberingUsesFixedWidth: boolean;
  requiredIssuerFields: readonly string[];
  countyRegion?: CountyRegionField;
  showMol: boolean;
  showSignatureRow: boolean;
  showOriginalStamp: boolean;
}

const EU_DIRECTIVE_SME_EXEMPTION_GROUND =
  'VAT exemption for small enterprises, Article 284 of Council Directive 2006/112/EC';

const EU_DIRECTIVE_EXEMPTION_GROUNDS = [
  EU_DIRECTIVE_SME_EXEMPTION_GROUND,
  'Reverse charge, Article 196 of Council Directive 2006/112/EC',
  'Intra-Community supply, Article 138 of Council Directive 2006/112/EC',
  'Export, Article 146 of Council Directive 2006/112/EC',
  'Exempt supply, Article 132 or 135 of Council Directive 2006/112/EC',
] as const;

export const GENERIC_EU_CONFIG: Omit<CountryConfig, 'country'> = {
  locale: 'en',
  language: 'en',
  vatRates: [
    { rateBp: 2000, label: '20%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2000,
  companyIdLabel: 'Company registration no.',
  vatNumberPattern: null,
  exemptionGrounds: EU_DIRECTIVE_EXEMPTION_GROUNDS,
  defaultExemptionGround: EU_DIRECTIVE_SME_EXEMPTION_GROUND,
  identifiers: [],
  numberingUsesFixedWidth: false,
  requiredIssuerFields: ['companyName', 'street', 'city', 'postcode'],
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
};

export const GENERIC_NON_EU_CONFIG: Omit<CountryConfig, 'country'> = {
  ...GENERIC_EU_CONFIG,
  vatRates: [{ rateBp: 0, label: '0%' }],
  defaultVatRateBp: 0,
  exemptionGrounds: [],
  defaultExemptionGround: null,
};
