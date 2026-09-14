import { getCountryConfig, isDocumentLanguage } from '@fakturcho/shared-types';
import type { ClassicLanguage } from './templates/classic/labels';

export function resolveDocumentLanguage(
  documentLanguage: string | null,
  issuerCountry: string | null,
): ClassicLanguage {
  if (isDocumentLanguage(documentLanguage)) return documentLanguage;
  return getCountryConfig(issuerCountry ?? 'BG').language;
}
