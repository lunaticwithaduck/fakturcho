import type { VatExemptionGround } from './vat';

export const SUPPORTED_LOCALES = ['bg', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const EU_VAT_AREA_COUNTRIES = [
  'AT',
  'BE',
  'BG',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'HU',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
] as const;
export type EuVatAreaCountry = (typeof EU_VAT_AREA_COUNTRIES)[number];

export function isEuVatAreaCountry(country: string): country is EuVatAreaCountry {
  return (EU_VAT_AREA_COUNTRIES as readonly string[]).includes(country);
}

export interface VatRateOption {
  rateBp: number;
  label: string;
}

export interface CountryConfig {
  country: string;
  locale: Locale;
  vatRates: VatRateOption[];
  defaultVatRateBp: number;
  companyIdLabel: string;
  vatNumberPattern: RegExp | null;
  exemptionGrounds: readonly VatExemptionGround[];
  numberingUsesFixedWidth: boolean;
  requiredIssuerFields: readonly string[];
  showMol: boolean;
  showSignatureRow: boolean;
  showDualDisplay: boolean;
  showOriginalStamp: boolean;
}

const BG_CONFIG: CountryConfig = {
  country: 'BG',
  locale: 'bg',
  vatRates: [
    { rateBp: 2000, label: '20%' },
    { rateBp: 900, label: '9%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2000,
  companyIdLabel: 'ЕИК',
  vatNumberPattern: /^BG\d{9,10}$/,
  exemptionGrounds: [],
  numberingUsesFixedWidth: true,
  requiredIssuerFields: ['companyName', 'eik', 'addressLine', 'city'],
  showMol: true,
  showSignatureRow: true,
  showDualDisplay: true,
  showOriginalStamp: true,
};

const GENERIC_EU_CONFIG: Omit<CountryConfig, 'country'> = {
  locale: 'en',
  vatRates: [
    { rateBp: 2000, label: '20%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2000,
  companyIdLabel: 'Company registration no.',
  vatNumberPattern: null,
  exemptionGrounds: [],
  numberingUsesFixedWidth: false,
  requiredIssuerFields: ['companyName', 'street', 'city', 'postcode'],
  showMol: false,
  showSignatureRow: false,
  showDualDisplay: false,
  showOriginalStamp: false,
};

const GENERIC_NON_EU_CONFIG: Omit<CountryConfig, 'country'> = {
  ...GENERIC_EU_CONFIG,
  vatRates: [{ rateBp: 0, label: '0%' }],
  defaultVatRateBp: 0,
};

export function getCountryConfig(country: string): CountryConfig {
  if (country === 'BG') return BG_CONFIG;
  if (isEuVatAreaCountry(country)) return { ...GENERIC_EU_CONFIG, country };
  return { ...GENERIC_NON_EU_CONFIG, country };
}

export function isReverseCharge(issuerCountry: string, clientCountry: string | null): boolean {
  if (!clientCountry) return false;
  if (issuerCountry === clientCountry) return false;
  return isEuVatAreaCountry(issuerCountry) && isEuVatAreaCountry(clientCountry);
}
