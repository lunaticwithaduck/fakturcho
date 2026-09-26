import { type CountryConfig, GENERIC_EU_CONFIG, GENERIC_NON_EU_CONFIG } from './countries/base';
import { CZ_CONFIG } from './countries/cz';
import { DE_CONFIG } from './countries/de';
import { EU_RATE_OVERRIDES } from './countries/eu-rates';
import { FR_CONFIG } from './countries/fr';
import { IT_CONFIG } from './countries/it';
import { PL_CONFIG } from './countries/pl';
import { RO_CONFIG } from './countries/ro';
import type { Locale } from './languages';
import { PUBLISHED_LOCALES } from './languages';
import { DEFAULT_EXEMPTION_GROUND, VAT_EXEMPTION_GROUNDS } from './vat';

export * from './countries/base';
export { FORFETTARIO_GROUND } from './countries/it';
export * from './countries/non-euro';
export * from './languages';

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

const BG_CONFIG: CountryConfig = {
  country: 'BG',
  locale: 'bg',
  language: 'bg',
  timeZone: 'Europe/Sofia',
  vatRates: [
    { rateBp: 2000, label: '20%' },
    { rateBp: 900, label: '9%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2000,
  companyIdLabel: 'ЕИК / Булстат',
  vatNumberPattern: /^BG\d{9,10}$/,
  exemptionGrounds: [...VAT_EXEMPTION_GROUNDS, DEFAULT_EXEMPTION_GROUND],
  defaultExemptionGround: DEFAULT_EXEMPTION_GROUND,
  vatNoteGrounds: ['Обратно начисляване – чл. 21, ал. 2 от ЗДДС'],
  zeroRateGrounds: ['чл. 28 от ЗДДС', 'чл. 30, ал. 1 от ЗДДС', 'чл. 53, ал. 1 от ЗДДС'],
  identifiers: [],
  numberingUsesFixedWidth: true,
  requiredIssuerFields: ['companyName', 'eik', 'addressLine', 'city'],
  showMol: true,
  showSignatureRow: true,
  showOriginalStamp: true,
  deliveryNotePricesShown: true,
  deliveryNoteTransportReasons: [],
  taxEventDateAlwaysShown: true,
};

const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  BG: BG_CONFIG,
  CZ: CZ_CONFIG,
  DE: DE_CONFIG,
  FR: FR_CONFIG,
  IT: IT_CONFIG,
  PL: PL_CONFIG,
  RO: RO_CONFIG,
};

// A country's own language is its UI locale, but only once translators have
// published it — never land a signup on a locale with no messages file.
function resolveLocale(config: CountryConfig): CountryConfig {
  const language = config.language;
  const locale = (PUBLISHED_LOCALES as readonly string[]).includes(language) ? language : 'en';
  return { ...config, locale };
}

const GENERIC_COUNTRY_EXTRAS: Record<string, Partial<CountryConfig>> = {
  IE: { documentTypeTitles: { debit_note: 'Supplementary invoice' } },
};

export function getCountryConfig(country: string): CountryConfig {
  const configured = COUNTRY_CONFIGS[country];
  if (configured) return resolveLocale(configured);
  const rateOverride = EU_RATE_OVERRIDES[country];
  if (rateOverride) {
    return resolveLocale({
      ...GENERIC_EU_CONFIG,
      country,
      ...rateOverride,
      ...GENERIC_COUNTRY_EXTRAS[country],
    });
  }
  if (isEuVatAreaCountry(country)) return resolveLocale({ ...GENERIC_EU_CONFIG, country });
  return resolveLocale({ ...GENERIC_NON_EU_CONFIG, country });
}

// BG_CONFIG.companyIdLabel is Cyrillic, the correct label for Bulgarian UI.
// A Bulgarian company viewed from a non-bg UI still needs a readable label.
const BG_COMPANY_ID_LABEL_LATIN = 'UIC / BULSTAT';

export function companyIdLabelFor(country: string, uiLocale: Locale): string {
  if (country === 'BG' && uiLocale !== 'bg') return BG_COMPANY_ID_LABEL_LATIN;
  return getCountryConfig(country).companyIdLabel;
}

export function isReverseCharge(issuerCountry: string, clientCountry: string | null): boolean {
  if (!clientCountry) return false;
  if (issuerCountry === clientCountry) return false;
  return isEuVatAreaCountry(issuerCountry) && isEuVatAreaCountry(clientCountry);
}
