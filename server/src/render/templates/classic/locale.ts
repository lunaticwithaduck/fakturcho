import { getCountryConfig } from '@fakturcho/shared-types';
import { CLASSIC_LABELS, type ClassicLabels, type ClassicLanguage } from './labels';

export interface ClassicLocaleContext {
  language: ClassicLanguage;
  labels: ClassicLabels;
  issuerCountry: string;
  timeZone: string;
  showMol: boolean;
  showSignatureRow: boolean;
  showOriginalStamp: boolean;
  showDeliveryNotePrices: boolean;
}

export function resolveClassicLocale(
  language: ClassicLanguage,
  issuerCountry: string | null = null,
): ClassicLocaleContext {
  const country = getCountryConfig(issuerCountry ?? (language === 'bg' ? 'BG' : ''));
  return {
    language,
    labels: CLASSIC_LABELS[language],
    issuerCountry: country.country,
    timeZone: country.timeZone,
    showMol: country.showMol,
    showSignatureRow: country.showSignatureRow,
    showOriginalStamp: country.showOriginalStamp,
    showDeliveryNotePrices: country.deliveryNotePricesShown,
  };
}
