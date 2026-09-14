import { getCountryConfig } from '@fakturcho/shared-types';
import { CLASSIC_LABELS, type ClassicLabels, type ClassicLanguage } from './labels';

export interface ClassicLocaleContext {
  language: ClassicLanguage;
  labels: ClassicLabels;
  issuerCountry: string;
  showMol: boolean;
  showSignatureRow: boolean;
  showDualDisplay: boolean;
  showOriginalStamp: boolean;
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
    showMol: country.showMol,
    showSignatureRow: country.showSignatureRow,
    showDualDisplay: country.showDualDisplay,
    showOriginalStamp: country.showOriginalStamp,
  };
}
