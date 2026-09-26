import { getCountryConfig } from '@fakturcho/shared-types';
import { type ClassicLabels, type ClassicLanguage, getClassicLabels } from './labels';

export interface ClassicLocaleContext {
  language: ClassicLanguage;
  labels: ClassicLabels;
  issuerCountry: string;
  timeZone: string;
  showMol: boolean;
  showSignatureRow: boolean;
  showOriginalStamp: boolean;
  showDeliveryNotePrices: boolean;
  taxEventDateAlwaysShown: boolean;
}

export function resolveClassicLocale(
  language: ClassicLanguage,
  issuerCountry: string | null = null,
): ClassicLocaleContext {
  const country = getCountryConfig(issuerCountry ?? (language === 'bg' ? 'BG' : ''));
  return {
    language,
    labels: getClassicLabels(language, country.country),
    issuerCountry: country.country,
    timeZone: country.timeZone,
    showMol: country.showMol,
    showSignatureRow: country.showSignatureRow,
    showOriginalStamp: country.showOriginalStamp,
    showDeliveryNotePrices: country.deliveryNotePricesShown,
    taxEventDateAlwaysShown: country.taxEventDateAlwaysShown,
  };
}
