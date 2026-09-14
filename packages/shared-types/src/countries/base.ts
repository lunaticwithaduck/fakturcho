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
  showMol: boolean;
  showSignatureRow: boolean;
  showDualDisplay: boolean;
  showOriginalStamp: boolean;
}

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
  exemptionGrounds: [],
  defaultExemptionGround: null,
  identifiers: [],
  numberingUsesFixedWidth: false,
  requiredIssuerFields: ['companyName', 'street', 'city', 'postcode'],
  showMol: false,
  showSignatureRow: false,
  showDualDisplay: false,
  showOriginalStamp: false,
};

export const GENERIC_NON_EU_CONFIG: Omit<CountryConfig, 'country'> = {
  ...GENERIC_EU_CONFIG,
  vatRates: [{ rateBp: 0, label: '0%' }],
  defaultVatRateBp: 0,
};
