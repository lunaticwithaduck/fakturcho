import {
  type DocumentLanguage,
  getCountryConfig,
  isDocumentLanguage,
} from '@fakturcho/shared-types';

export type Locale = DocumentLanguage;

export function resolveEmailLocale(
  documentLanguage: string | null,
  issuerCountry: string | null,
  recipientCountry: string | null,
): Locale {
  if (isDocumentLanguage(documentLanguage)) return documentLanguage;
  if (issuerCountry) return getCountryConfig(issuerCountry).language;
  if (recipientCountry) return getCountryConfig(recipientCountry).language;
  return 'bg';
}
