import type { ClassicLanguage } from './templates/classic/labels';

function isClassicLanguage(value: string | null): value is ClassicLanguage {
  return value === 'bg' || value === 'en';
}

export function resolveDocumentLanguage(
  documentLanguage: string | null,
  issuerCountry: string | null,
): ClassicLanguage {
  if (isClassicLanguage(documentLanguage)) return documentLanguage;
  return (issuerCountry ?? 'BG') === 'BG' ? 'bg' : 'en';
}
